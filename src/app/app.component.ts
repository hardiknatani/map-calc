import { formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSlider } from '@angular/material/slider';
import * as MapboxDraw from '@mapbox/mapbox-gl-draw';
import { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import { InspectControl } from 'mapbox-gl-controls';
import { IControl, GeoJSONSource, Map } from 'maplibre-gl';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { lastValueFrom } from 'rxjs';
import { API_KEY, basemaps, borderAndAreasLayers, colormaps } from './shared/map.common';
import * as maplibregl from 'maplibre-gl';
import { environment } from 'src/environments/environment';
import TileBoundariesControl from './shared/maplibre-custom-controls/TileBoundariesControl';
import { TileUtils } from './shared/tileutils';
import * as turf from '@turf/turf'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit,AfterViewInit,OnDestroy {
  map: Map ;

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;
  @ViewChild('colorramp', { static: true }) colorramp!: ElementRef<HTMLDivElement>;
  @ViewChild('elevSliderRef', { static: true }) elevSliderRef!: MatSlider;

  @BlockUI() blockUI: NgBlockUI;
 formatNumber=formatNumber
 showElevationGraph=false;
  mapControls: any;
  showFiller = false;

  selectedConfigLayer:any = null;
  basemaps = basemaps;
  borderAndAreasLayers = borderAndAreasLayers;
  colormaps=colormaps;
  selectedColorramp = new FormControl('Default')
  API_KEY = environment.maptilerApiKey;
  bufferRadius=new FormControl()
  drawControlOptions = {
    displayControlsDefault: false,
    userProperties: true,
    controls: {
      // polygon: true,
      // trash: true
      point:true
    },
  }
  layersStyle: any
  draw: any = ((new MapboxDraw(this.drawControlOptions) as any) as IControl)

  elevationProperties={
    elevRange:[0,0],
    interval:10
  }
  graduatedColorAttribute= new FormControl()
  graduatedStepsForm= new FormGroup({ 
        stop:new FormControl(),
        color:new FormControl(),
      
  })
elevationSlider = new FormControl(0);

 graduatedColorTable:{
  value:string,
  color?:string,
}[]=[
//   {
//   value:"0",
//   color: "transparent"
// }
];
reliefLayer=false;
 tileExtext:any = [
];
showControls=false
selectedFeature:any;
tileUtils =new TileUtils()


tileUrl:String=''
createTileKey(tileIndex) {
  return `${tileIndex.zoom}_${tileIndex.y}_${tileIndex.x}`;
}
  constructor(private dialog: MatDialog, private fb: FormBuilder, private bottomSheet: MatBottomSheet, private http: HttpClient) { ; }


  getBoundsFromTitler(layer){
    let url = `${environment.titiler_base_url}/mosaicjson/bounds?url=${layer.url}`
    // let url = `http://localhost:8000/bounds?url=${layer.url}`

return this.http.get(url)
  }


  ngOnInit(): void {
  this.initMap()

  this.elevationSlider.valueChanges.subscribe(value=>{
    this.map.setFilter('relief-layer',['>=','elevation',this.parseFilter(value)])
  });

  
  }
  ngOnDestroy() {

    if (this.bottomSheet._openedBottomSheetRef) {
      this.bottomSheet.dismiss()
    }
    [...this.borderAndAreasLayers,]
      .forEach(layer => {
        if (layer.active)
          layer.active = false;
      })
  }
  ngAfterViewInit(): void {


  }

  handleLayerVisibility(layerData, setActive) {
    let source = this.map.getSource(layerData.id);
    if (!source) {
      this.map.addSource(layerData.id, {
        type: layerData["type"],
        tiles: layerData.tiles,
        ...((layerData.bounds)&&{"bounds":layerData.bounds}),
        ...((layerData.volatile)&&{"volatile":layerData.volatile}),
        ...(layerData.type=='raster'&& {tileSize:512})
      });
        const layer = this.map.getLayer( layerData.sourceLayer.id);

        if (!layer) {
          this.map.addLayer({
            "id":  layerData.sourceLayer.id,
            "type":  layerData.sourceLayer.type,
            "source": layerData.id,
            "source-layer":  layerData.sourceLayer.sourceLayer,
            "filter": ['all'],
            "paint": layerData.paint,
            "layout":layerData.layout?layerData.layout:{},
            "metadata":{
              name:layerData.name
            }
          });
        }
      // });
    }


      const visibility = this.map.getLayoutProperty(
        layerData.sourceLayer.id,
        'visibility'
      );

      if (visibility === 'visible') {
        this.map.setLayoutProperty( layerData.sourceLayer.id, 'visibility', 'none');
      } else {
        this.map.setLayoutProperty(
          layerData.sourceLayer.id,
          'visibility',
          'visible'
        );
      }
    // });

    if (setActive)
      layerData.active = !layerData.active;

  }

  generateRandomColor() {
    let newColor = "#" + (Math.floor(Math.random() * 900000 + 100000)).toString()
    return newColor
  };


  parseFilter(v: any) {
    let tryParseInt = (v: any) => {
      if (v === '') return v
      if (isNaN(v)) return v
      return parseFloat(v)
    }

    let tryParseBool = (v: any) => {
      const isString = (typeof (v) === "string");
      if (!isString) {
        return v;
      }

      if (v.match(/^\s*true\s*$/)) {
        return true;
      }
      else if (v.match(/^\s*false\s*$/)) {
        return false;
      }
      else {
        return v;
      }
    }

    v = tryParseInt(v);
    v = tryParseBool(v);
    return v;
  }

  showSettings(layer){
    this.selectedConfigLayer=layer;
    this.showControls=true;
  }




  initMap() {

    const initialState = { lng: 5.339355468750009, lat:60.02369688198334, zoom: 13 };
    // const initialState = { lng: -74.032196, lat: 40.526148, zoom: 9 };

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/5bbd1a63-591a-469a-bdaa-c89c18c32654/style.json?key=${this.API_KEY}`,
      center: [    5.596785544036919,
        60.019994761409535,],
      zoom: initialState.zoom,
      attributionControl:false,
    });

    let inspectControl: IControl = ((new InspectControl() as any) as IControl)
    this.map.addControl(inspectControl)
    this.map.addControl(this.draw);
    this.map.addControl (new TileBoundariesControl())
    // this.map.addControl(new LegendControl())
    let that = this
    // this.map.on('styledata', function () {
    //   that.layersStyle = that.map.getStyle().layers
    // })
    this.map.on('draw.create', (e: DrawCreateEvent) => {
        this.draw.deleteAll()
        this.draw.add(e.features[0])
        this.selectedFeature = e.features[0]
        this.showControls=true;
  
        let lng = this.selectedFeature.geometry.coordinates[0]
        let lat = this.selectedFeature.geometry.coordinates[1]
  
        var marker = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(this.map);

    });

    this.map.on('mousemove', function (e) {
      (document.getElementById('position-info') as any).innerHTML =
      `<b>Lat: </b>${Number(e.lngLat.lat).toFixed(5)}, <b>Lng: </b>${Number(e.lngLat.lng).toFixed(5)}`
      // JSON.stringify(e.lngLat.wrap());
      });

      this.map.on('zoom',(e)=>{
        // console.log(this.map.getZoom());
        (document.getElementById('zoom-info') as any).innerHTML ='<b>Zoom</b>: '+Number(this.map.getZoom()).toFixed(2)

      })

  }









}
