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

  selectedConfigLayer = null;
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
projectAreaGeojson:any={}
mosaicJsonBase={
  "mosaicjson": "0.0.2",

  "name": "compositing",

  "description": "A simple, light grey world.",

  "version": "1.0.0",

  "attribution": "<a href='http://openstreetmap.org'>OSM contributors</a>",

  "minzoom": 10,

  "maxzoom": 16,

  "quadkey_zoom": 10,

  "bounds": [  ],

  "center": [ ],

  "tiles": {

  }
}

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
        type: layerData.type,
        tiles: layerData.tiles,
      });
      // layerData.sourceLayer.forEach(element => {
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

    // layerData.sourceLayer.forEach(element => {

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

      if(layerData.url)
    {  this.getBoundsFromTitler(layerData).subscribe(data=>this.map.fitBounds(data['bounds']));
    // this.tileUrl=layerData.url;
    //   this.addContour(layerData.url);
    }
  }




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



      onChangeColorRamp(){
 
        let tiles = `${environment.titiler_base_url}/mosaicjson/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?url=${this.tileUrl}`;
        switch (this.selectedColorramp.value) {
          case "Default":
            tiles=`${environment.titiler_base_url}/mosaicjson/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?url=${this.tileUrl}&nodta=0&bidx=1&rescale=0%2C1`
            break;
          default:
            tiles=`${environment.titiler_base_url}/mosaicjson/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?url=${this.tileUrl}&bidx=1&rescale=0%2C1&colormap_name=${this.selectedColorramp.value}&nodata=0`
            break;
        }
        console.log(this.selectedColorramp.value);
       this.map.removeLayer('project_area_dem_layer')
        this.map.removeSource('project_area_dem')

        this.map.addSource('project_area_dem',{
          type:'raster',
          tiles:[
            tiles
          ],
        });
        this.map.addLayer({
          type:'raster',
          id:'project_area_dem_layer',
          source:'project_area_dem',
        });

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

  }



 async getMosaicJsonUrl(lat,lng,radius){

  this.projectAreaGeojson={
    "type": "FeatureCollection",
    "features": [
      this.tileUtils.generateBufferCircle(lat,lng,this.bufferRadius.value)
    ]
  };
  
this.map.addSource('project-area', {
  type: 'geojson',
  data: this.projectAreaGeojson,
});

this.map.addLayer({
  id: 'project-area-layer',
  type: 'fill',
  source: 'project-area',
  layout: {},
  paint: {
    // 'fill-color': colorsArr,
    'fill-opacity':0.5
  },
});

let minZoom = 10;
let tiles = this.tileUtils.getTiles(this.projectAreaGeojson.features[0].geometry,{min_zoom: minZoom,  max_zoom: minZoom});
this.tileExtext=[]
tiles.forEach(tile=>{this.tileExtext.push({x:tile[0],y:tile[1],zoom:tile[2]})})


    let data =await lastValueFrom( this.http.post('http://localhost:5000/uploadMosaicJson',{
      lat:lat,
      lng:lng,
      radius:radius
    }));


    this.tileUrl=data['url'];
    return data

  }

  async addDemLayer(){

    
  let data:any = await  this.getMosaicJsonUrl(this.selectedFeature.geometry.coordinates[1],this.selectedFeature.geometry.coordinates[0],this.bufferRadius.value); 
    let bbox:any = turf.bbox(this.projectAreaGeojson)
    console.log(data)
    this.map.addSource('project_area_dem',{
      type:'raster',
      tiles:[
        `${environment.titiler_base_url}/mosaicjson/tiles/{z}/{x}/{y}@2x.png?url=${data.url}&algorithm=hillshade&resampling=bilinear`
      ],
      tileSize:256
      // bounds:bbox
    });
    this.map.addLayer({
      type:'raster',
      id:'project_area_dem_layer',
      source:'project_area_dem',
      // minzoom:1
    });


    // this.map.addSource("bounds-source",{
    //   type:"geojson",
    //   data:turf.bboxPolygon(data.bounds)
    // }).addLayer({
    //   type:'fill',
    //   source:"bounds-source",
    //   id:"bounds-layer",
    //   paint:{
    //     // "fill-color":'transparent',
    //     'fill-opacity':0.25
    //   }
    // });

    // this.map.addSource("bounds-source2",{
    //   type:"geojson",
    //   data:turf.bboxPolygon(bbox)
    // }).addLayer({
    //   type:'fill',
    //   source:"bounds-source2",
    //   id:"bounds-layer2",
    //   paint:{
    //     "fill-color":'red',
    //     'fill-opacity':0.25
    //   }
    // })
    // this.map.addControl(new TerrainControl({source:'project_area_dem',exaggeration:1}))
    this.map.moveLayer("project-area-layer")
  }

  addContour(url){
let tiles;
    this.http.get(`${environment.titiler_base_url}/cog/info.geojson?url=${url}`).subscribe(data=>{
        // let minzoom = data['properties']['minzoom'];
        let minzoom = 12;

     tiles =  this.tileUtils.getTiles(data['geometry'],{min_zoom:minzoom ,  max_zoom: minzoom});
     let tileExtent:any=[]
    tiles.forEach(tile=>{tileExtent.push({x:tile[0],y:tile[1],zoom:tile[2]})});
    // tiles.forEach(tile=>{this.tileExtext.push({x:tile[0],y:tile[1],zoom:tile[2]})})
    })
  }

}
