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
import { environment } from '../environments/environment';
import TileBoundariesControl from './shared/maplibre-custom-controls/TileBoundariesControl';
import { TileUtils } from './shared/tileutils';
import * as turf from '@turf/turf'
import MeasuresControl from 'maplibre-gl-measures';
import  DrawRectangle from './shared/draw-custom-modes/rectangle/rectangle';
import DragCirceMode from './shared/draw-custom-modes/circle/modes/DragCircleMode';
import StaticMode from './shared/draw-custom-modes/static/Static'
import SaveEditsControl from './shared/maplibre-custom-controls/EditSaveControl';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit,AfterViewInit,OnDestroy {
  map: Map ;

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;

  // @BlockUI() blockUI: NgBlockUI;
  mapControls: any;
  showFiller = false;
  selectedConfigLayer:any = null;
  basemaps = basemaps;
  borderAndAreasLayers = borderAndAreasLayers;
  colormaps=colormaps;
  selectedColorramp = new FormControl('Default')
  API_KEY = environment.maptilerApiKey;
  bufferRadius=new FormControl()
  drawControlOptions:MapboxDraw.MapboxDrawOptions = {
    displayControlsDefault: false,
    userProperties: true,
    modes:{
      ...MapboxDraw.modes,
      'draw_rectangle':DrawRectangle,
      'draw_circle':DragCirceMode,
      'static':StaticMode
    },
    controls: {
      line_string:true,
      polygon: true,
      point:true
    },
  }
  layersStyle: any
  draw: any = ((new MapboxDraw(this.drawControlOptions) as any) as IControl)

showControls=false
selectedFeature:any;
tileUtils =new TileUtils()


tileUrl:String=''
createTileKey(tileIndex) {
  return `${tileIndex.zoom}_${tileIndex.y}_${tileIndex.x}`;
}

isEditing=false;
currentEditFeature:any;

  constructor(private dialog: MatDialog, private fb: FormBuilder, private bottomSheet: MatBottomSheet, private http: HttpClient) { ; }


  getBoundsFromTitler(layer){
    let url = `${environment.titiler_base_url}/mosaicjson/bounds?url=${layer.url}`
    // let url = `http://localhost:8000/bounds?url=${layer.url}`

return this.http.get(url)
  }


  ngOnInit(): void {
  this.initMap()
     let drawCtrl =  Array.from(document.getElementsByClassName('mapboxgl-ctrl-group')).filter(ele=>ele.children[0].classList.contains('mapbox-gl-draw_ctrl-draw-btn'))[0];
     let rectangleButton = document.createElement('button');
     rectangleButton.classList.add('mapbox-gl-draw_ctrl-draw-btn');
     rectangleButton.classList.add('mapbox-gl-draw_rectangle');
     rectangleButton.addEventListener('click',()=>{
      if(this.draw.getMode()!='draw_rectangle') {
       this.draw.changeMode('draw_rectangle')
      }else{
        this.draw.changeMode('static')
      }
     })
     drawCtrl.appendChild(rectangleButton);

     let circleButton = document.createElement('button');
     circleButton.classList.add('mapbox-gl-draw_ctrl-draw-btn');
     circleButton.classList.add('mapbox-gl-draw_circle');
     circleButton.addEventListener('click',()=>{
      if(this.draw.getMode()!='draw_circle') {
       this.draw.changeMode('draw_circle')
      }else{
        this.draw.changeMode('simple_select')
      }
     });
     drawCtrl.appendChild(circleButton);

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

  toggleSidebar() {
    const id = "right";
    let elem = (document.getElementById(id) as any);
    let classes = elem.className.split(" ");
    let collapsed = classes.indexOf("collapsed") !== -1;

    let padding = {};

    if (collapsed) {
      classes.splice(classes.indexOf("collapsed"), 1);

      padding[id] = 300; 

    } else {
      padding[id] = 0;
      classes.push("collapsed");

    }
    elem.className = classes.join(" ");
  }




  initMap() {

    const initialState = { lng: 5.339355468750009, lat:60.02369688198334, zoom: 9 };

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
    this.map.addControl (new TileBoundariesControl());
    // this.map.addControl(new SaveEditsControl());
    let that = this


    this.map.on('mousemove', function (e) {
      (document.getElementById('position-info') as any).innerHTML =
      `<b>Lat: </b>${Number(e.lngLat.lat).toFixed(5)}, <b>Lng: </b>${Number(e.lngLat.lng).toFixed(5)}`
      });

      this.map.on('zoom',(e)=>{
        (document.getElementById('zoom-info') as any).innerHTML ='<b>Zoom</b>: '+Number(this.map.getZoom()).toFixed(2)

      });

      this.map.on('draw.create',(e)=>{
        let feature = e.features[0];
        switch (feature.geometry.type) {
          case 'Polygon':
            feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
            let polygonData:any =( this.map.getSource('polygon-draw-source') as GeoJSONSource)._data;
            polygonData.features.push(feature);
            (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData(polygonData);
            break;

          case "LineString":
            feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
            let lineData:any =( this.map.getSource('line-draw-source') as GeoJSONSource)._data;
            lineData.features.push(feature);
            (this.map.getSource('line-draw-source') as GeoJSONSource).setData(lineData);
          break;

          case "Point":
            feature['properties']['id']=(Math.floor(Math.random() * 900000 + 100000));
            let pointData:any =( this.map.getSource('point-draw-source') as GeoJSONSource)._data;
            pointData.features.push(feature);
            console.log(pointData);
            (this.map.getSource('point-draw-source') as GeoJSONSource).setData(pointData);


          break;

          default:

        }
        console.log(feature)

        this.draw.deleteAll()
    });

      this.map.on('contextmenu',(event)=>{
      let selectedFeatures =  this.map.queryRenderedFeatures(event.point);
      let drawFeatures = selectedFeatures.filter(feature=>(feature.source=='polygon-draw-source' || feature.source=='line-draw-source' || feature.source=='point-draw-source') )
      if (drawFeatures && drawFeatures.length > 0) {
        let feature = drawFeatures[0];
        console.log(feature)
        this.addFeatureOptionPopup(event,feature)

      }});

      this.map.on('style.load',()=>{

        this.map.addSource("polygon-draw-source",{
          type:'geojson',
          data:{
          type:"FeatureCollection",
          features:[]
        }});
          this.map.addLayer({
            'id': 'polygon-draw-layer',
            'type': 'fill',
            'source': 'polygon-draw-source',
            'paint': {
            'fill-color':  '#E21818',
            "fill-opacity":0.5,
          'fill-outline-color':'#F84C4C'
            }
          });

          this.map.addSource("line-draw-source",{
            type:'geojson',
            data:{
            type:"FeatureCollection",
            features:[]
          }});
            this.map.addLayer({
              'id': 'line-draw-layer',
              'type': 'line',
              'source': 'line-draw-source',
              'paint': {
              "line-color":"red",
              "line-width":5
              }
            });

            this.map.addSource("point-draw-source",{
              type:'geojson',
              data:{
              type:"FeatureCollection",
              features:[]
            }});
              this.map.addLayer({
                'id': 'point-draw-layer',
                'type': 'symbol',
                'source': 'point-draw-source',
                'paint': {
                  "icon-opacity":1
                },
                layout:{
                  'icon-size':1,
                  "icon-image":'mapbox-marker-icon-red'
                }
              })

      })


  }




  addFeatureOptionPopup(event,feature){
    console.log(feature)
    let options = document.createElement('div');

    let editButton = document.createElement('button')
    editButton.innerHTML = "Edit"
    editButton.addEventListener('click', () => {
      let data:any;
      this.currentEditFeature;

      switch (feature.geometry.type) {
        case "Polygon":
         data =( this.map.getSource('polygon-draw-source') as GeoJSONSource)._data;
          this.currentEditFeature = (data.features.filter(ele=> ele.properties.id==feature.properties.id))[0];
    
          data = data.features.filter(ele=> ele.properties.id!=feature.properties.id);
          (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData({
            type:"FeatureCollection",
            features:data
          });
          break;
      case "LineString":

      data =( this.map.getSource('line-draw-source') as GeoJSONSource)._data;
      this.currentEditFeature = (data.features.filter(ele=> ele.properties.id==feature.properties.id))[0];
      data = data.features.filter(ele=> ele.properties.id!=feature.properties.id);
      (this.map.getSource('line-draw-source') as GeoJSONSource).setData({
        type:"FeatureCollection",
        features:data
      });
        break;
        case "Point":
          data =( this.map.getSource('point-draw-source') as GeoJSONSource)._data;
          this.currentEditFeature = (data.features.filter(ele=> ele.properties.id==feature.properties.id))[0];    
          data = data.features.filter(ele=> ele.properties.id!=feature.properties.id);
          (this.map.getSource('point-draw-source') as GeoJSONSource).setData({
            type:"FeatureCollection",
            features:data
          });
        break
        default:
        break;
      }



      this.draw.deleteAll();
      this.isEditing=true;
      this.draw.add(this.currentEditFeature);
      featureOptionPopup.remove()

    });

    let infoButton = document.createElement('button')
    infoButton.innerHTML = "Info"
    infoButton.addEventListener('click', () => {
      featureOptionPopup.remove()

    });

    let propertiesButton = document.createElement('button')
    propertiesButton.innerHTML = "Properties"
    propertiesButton.addEventListener('click', () => {
      console.log(feature.properties);

      featureOptionPopup.remove()

    });

    let deleteButton = document.createElement('button')
    deleteButton.innerHTML = "Delete"
    deleteButton.addEventListener('click', () => {

      switch (feature.geometry.type) {
        case "Polygon":
          let polygonData:any =( this.map.getSource('polygon-draw-source') as GeoJSONSource)._data;
          polygonData=  polygonData.features.filter(ele=>   ele.properties.id!=feature.properties.id);
            (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData({
              type:"FeatureCollection",
              features:polygonData
            });
            featureOptionPopup.remove()
          break;
          case "LineString":
            let lineData:any =( this.map.getSource('line-draw-source') as GeoJSONSource)._data;
            lineData=  lineData.features.filter(ele=>   ele.properties.id!=feature.properties.id);
              (this.map.getSource('line-draw-source') as GeoJSONSource).setData({
                type:"FeatureCollection",
                features:lineData
              });
              featureOptionPopup.remove()
          break;
          case "Point":
            let pointData:any =( this.map.getSource('point-draw-source') as GeoJSONSource)._data;
            pointData=  pointData.features.filter(ele=>   ele.properties.id!=feature.properties.id);
              (this.map.getSource('point-draw-source') as GeoJSONSource).setData({
                type:"FeatureCollection",
                features:pointData
              });
              featureOptionPopup.remove()
          break;
      
        default:
          break;
      }

        featureOptionPopup.remove()

    });


    options.className="options-buttons";
    options.append(editButton,infoButton,propertiesButton,deleteButton);

    let featureOptionPopup = new maplibregl.Popup({
      closeOnClick:true,
      closeButton:false,
      anchor:'left'
    }).setLngLat(event.lngLat).setDOMContent(options);
    featureOptionPopup.addClassName('featureOptionsPopup')
    

    const popups = document.getElementsByClassName("featureOptionsPopup");
console.log(popups)
    if (popups.length) {
      popups[0].remove();
      featureOptionPopup.addTo(this.map)
    } else {
      featureOptionPopup.addTo(this.map)
    }

    featureOptionPopup.addClassName('featureOptionsPopup')

  }

  onToggleEdit(action:string){
    let feature =action=='save'? this.draw.getAll().features[0]:this.currentEditFeature;
    switch (feature.geometry.type) {
        case 'Polygon':
          let polygonData:any =( this.map.getSource('polygon-draw-source') as GeoJSONSource)._data;
          polygonData.features.push(feature);
          (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData(polygonData);
          break;

        case "LineString":
          let lineData:any =( this.map.getSource('line-draw-source') as GeoJSONSource)._data;
          lineData.features.push(feature);
          (this.map.getSource('line-draw-source') as GeoJSONSource).setData(lineData);
        break;

        case "Point":
          let pointData:any =( this.map.getSource('point-draw-source') as GeoJSONSource)._data;
          pointData.features.push(feature);
          (this.map.getSource('point-draw-source') as GeoJSONSource).setData(pointData);
        break;

        default:

      }

    this.draw.deleteAll();
    this.isEditing=false;

  }

}
