import { formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { API_KEY, basemaps, borderAndAreasLayers, colormaps, transparentIcon } from './shared/map.common';
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
import  CodeMirror from 'codemirror/lib/codemirror'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit,AfterViewInit,OnDestroy {
  map: Map ;

  @ViewChild('map', { static: true }) private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;
  @ViewChild('codeMirror', { static: true }) codeMirror!: any;

  selectedTab:any;
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
currentPropertiesFeature:any={
  properties:{}
};

codeMirrorOptions:any = {
  mode: "javascript",
  indentWithTabs: true,
  smartIndent: true,
  lineNumbers: true,
  lineWrapping: false,
  extraKeys: { "Ctrl-Space": "autocomplete" },
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  autoCloseBrackets: true,
  matchBrackets: true,
  lint: true
};

geojsonText=`    {
  "type": "Feature",
  "properties": {
    "OBJECTID": 2,
    "AREA": null,
    "PERIMETER": null,
    "PSACOV_": null,
    "PSACOV_ID": null,
    "ID": 2,
    "DISTRICT__": null,
    "PSA_NUM": "011",
    "OLD_SECTOR": "A,B,C,D,E,F,J",
    "DESCRIPT": " "
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [
          -75.1972384309718,
          39.9294288633258
        ],
        [
          -75.1975797871954,
          39.9297460222877
        ],
        [
          -75.197851223868,
          39.9299982139769
        ],
        [
          -75.1981773481294,
          39.9303012133057
        ],
        [
          -75.1984404347389,
          39.9305822246998
        ],
        [
          -75.1989734981228,
          39.9311685475728
        ],
        [
          -75.1995890874574,
          39.9318162830364
        ],
        [
          -75.1996435921309,
          39.9319089040427
        ],
        [
          -75.2004793547048,
          39.9321087290989
        ],
        [
          -75.2023952213638,
          39.9325149366743
        ],
        [
          -75.2039006601381,
          39.9328540856866
        ],
        [
          -75.2063466273869,
          39.9332717677713
        ],
        [
          -75.2064403613034,
          39.9343522604078
        ],
        [
          -75.2064406267868,
          39.9343519842816
        ],
        [
          -75.2075746963447,
          39.9331743960283
        ],
        [
          -75.2089041011974,
          39.9317118928652
        ],
        [
          -75.209692981753,
          39.9308439938826
        ],
        [
          -75.2105249782829,
          39.9297303527703
        ],
        [
          -75.2111623220852,
          39.9284142844
        ],
        [
          -75.2115780894531,
          39.9276168909839
        ],
        [
          -75.2121490059876,
          39.9263559511866
        ],
        [
          -75.2124052761925,
          39.9253993653388
        ],
        [
          -75.2124107891114,
          39.9253570816528
        ],
        [
          -75.2125597988483,
          39.9242141137797
        ],
        [
          -75.2123695160914,
          39.9234033047393
        ],
        [
          -75.2119562339864,
          39.9226583143982
        ],
        [
          -75.2111184884471,
          39.9219605275583
        ],
        [
          -75.2099431529389,
          39.9211986525876
        ],
        [
          -75.2088849523256,
          39.9209912454975
        ],
        [
          -75.2077128776908,
          39.9208803583258
        ],
        [
          -75.2064804269311,
          39.9209096306415
        ],
        [
          -75.2052426845489,
          39.9210802795887
        ],
        [
          -75.2037552637412,
          39.9210472590519
        ],
        [
          -75.2026234580421,
          39.9205975925353
        ],
        [
          -75.2020413240572,
          39.9199478688103
        ],
        [
          -75.2019963097997,
          39.9197900025246
        ],
        [
          -75.2017931055259,
          39.9198273645595
        ],
        [
          -75.200064162256,
          39.9201452396009
        ],
        [
          -75.1950482923064,
          39.9210207454505
        ],
        [
          -75.1944871153373,
          39.921093127291
        ],
        [
          -75.193866259737,
          39.9211382495292
        ],
        [
          -75.192496515914,
          39.9212751297442
        ],
        [
          -75.1918216955625,
          39.9213969718549
        ],
        [
          -75.1912239318794,
          39.9215082569959
        ],
        [
          -75.19109651311,
          39.921535822553
        ],
        [
          -75.1910563276871,
          39.9215439907917
        ],
        [
          -75.1908181207006,
          39.9215924052437
        ],
        [
          -75.1906032442143,
          39.9216360789777
        ],
        [
          -75.1904778162788,
          39.9216615709245
        ],
        [
          -75.190467121886,
          39.9216637451057
        ],
        [
          -75.1903914147387,
          39.9216752125728
        ],
        [
          -75.1903198997035,
          39.9216860455573
        ],
        [
          -75.1901603786665,
          39.9217102093483
        ],
        [
          -75.1900641883892,
          39.9217247801069
        ],
        [
          -75.190061752615,
          39.9217253239968
        ],
        [
          -75.1898143646222,
          39.9214073964118
        ],
        [
          -75.1894204760175,
          39.9210159027192
        ],
        [
          -75.1893262792611,
          39.9209222773003
        ],
        [
          -75.189166000394,
          39.9207543104233
        ],
        [
          -75.1891067166248,
          39.920692184459
        ],
        [
          -75.1882563715244,
          39.9197627506702
        ],
        [
          -75.1880417190463,
          39.9194644453581
        ],
        [
          -75.1877982127209,
          39.9192603567515
        ],
        [
          -75.1874391922476,
          39.9190589136422
        ],
        [
          -75.187356229169,
          39.9190149047851
        ],
        [
          -75.1869640701906,
          39.9188757838728
        ],
        [
          -75.1860296897478,
          39.9186996257852
        ],
        [
          -75.1860203075313,
          39.9186978563325
        ],
        [
          -75.1851021047448,
          39.9185623140021
        ],
        [
          -75.1844051480309,
          39.9184518589698
        ],
        [
          -75.1828232853544,
          39.918241646974
        ],
        [
          -75.1809024871866,
          39.917980332554
        ],
        [
          -75.179315684924,
          39.9177880200005
        ],
        [
          -75.1783488133839,
          39.9176559621314
        ],
        [
          -75.1777354062223,
          39.9175847879295
        ],
        [
          -75.1772138079597,
          39.9175189844923
        ],
        [
          -75.1769674456912,
          39.9174783688216
        ],
        [
          -75.1767296471433,
          39.9174615756861
        ],
        [
          -75.1761782673161,
          39.9173864998217
        ],
        [
          -75.1756186447602,
          39.917317024315
        ],
        [
          -75.1753635613096,
          39.9172868674324
        ],
        [
          -75.1751293142598,
          39.9172525782361
        ],
        [
          -75.1746028536155,
          39.9171853038949
        ],
        [
          -75.1740704119774,
          39.9171077220951
        ],
        [
          -75.1735760841424,
          39.9170508742341
        ],
        [
          -75.1730294860299,
          39.9169737866598
        ],
        [
          -75.1723973007529,
          39.9168980781903
        ],
        [
          -75.171425272362,
          39.9167667149113
        ],
        [
          -75.1713975192285,
          39.9168940645707
        ],
        [
          -75.1713075047558,
          39.9173176776778
        ],
        [
          -75.1711252860858,
          39.9181614937128
        ],
        [
          -75.1708567874026,
          39.9194195133278
        ],
        [
          -75.1705833417027,
          39.9206627617172
        ],
        [
          -75.1703123182547,
          39.9218949555412
        ],
        [
          -75.17002648331,
          39.9231471128351
        ],
        [
          -75.1697474020715,
          39.9244185024022
        ],
        [
          -75.169502039404,
          39.9255408330957
        ],
        [
          -75.1694960863947,
          39.9256056253857
        ],
        [
          -75.1692299671065,
          39.9268153402634
        ],
        [
          -75.1689595099838,
          39.9280447316646
        ],
        [
          -75.1695834813467,
          39.928142125217
        ],
        [
          -75.1700517453207,
          39.9281963937926
        ],
        [
          -75.1705954060959,
          39.9282748853649
        ],
        [
          -75.1711396485421,
          39.9283380764705
        ],
        [
          -75.1715979995512,
          39.9283966118096
        ],
        [
          -75.1721572940794,
          39.9284723001757
        ],
        [
          -75.1727017699725,
          39.9285294072032
        ],
        [
          -75.1731638653763,
          39.9285970368283
        ],
        [
          -75.1737306258755,
          39.928669737971
        ],
        [
          -75.1752921815955,
          39.9288763304019
        ],
        [
          -75.1758813106957,
          39.9289502834899
        ],
        [
          -75.1763369941053,
          39.9290091822257
        ],
        [
          -75.1768740866329,
          39.9290709825532
        ],
        [
          -75.1784469861694,
          39.9292805090082
        ],
        [
          -75.1803702535509,
          39.9295309953347
        ],
        [
          -75.1819473184346,
          39.9297389934803
        ],
        [
          -75.1836029326224,
          39.9299372000963
        ],
        [
          -75.1838241475916,
          39.9299646911038
        ],
        [
          -75.1852422715228,
          39.9301555625456
        ],
        [
          -75.185774675517,
          39.9302154833119
        ],
        [
          -75.1862721779444,
          39.9302838512845
        ],
        [
          -75.1870291461071,
          39.9303909346327
        ],
        [
          -75.1870768011778,
          39.9303968426056
        ],
        [
          -75.1880628760684,
          39.9305190808542
        ],
        [
          -75.1886378285466,
          39.9305921032727
        ],
        [
          -75.1902238279788,
          39.9307884459173
        ],
        [
          -75.1910087552162,
          39.9308839631973
        ],
        [
          -75.19178532597,
          39.9309916639967
        ],
        [
          -75.1923254609691,
          39.9310636793195
        ],
        [
          -75.192818853362,
          39.9311256325037
        ],
        [
          -75.1933550094117,
          39.9311948304585
        ],
        [
          -75.193382529441,
          39.931089878274
        ],
        [
          -75.1937823549974,
          39.9308551072149
        ],
        [
          -75.194246407648,
          39.930607889797
        ],
        [
          -75.19510564757,
          39.9301471825682
        ],
        [
          -75.1955853444338,
          39.9298828478584
        ],
        [
          -75.1957355846101,
          39.9297979109173
        ],
        [
          -75.1958462776117,
          39.9297413153498
        ],
        [
          -75.1961172548188,
          39.9296027684427
        ],
        [
          -75.1962078608563,
          39.9295555461762
        ],
        [
          -75.1966535596668,
          39.9293232584321
        ],
        [
          -75.196925032985,
          39.9291749655328
        ],
        [
          -75.1972384309718,
          39.9294288633258
        ]
      ]
    ]
  }
},`

  constructor(private dialog: MatDialog, private fb: FormBuilder, private bottomSheet: MatBottomSheet, private http: HttpClient) { 

  }


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

    const initialState = { lng: 5.339355468750009, lat:60.02369688198334, zoom: 1 };

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/5bbd1a63-591a-469a-bdaa-c89c18c32654/style.json?key=${this.API_KEY}`,
      center: [    5.596785544036919,
        60.019994761409535,],
      zoom: initialState.zoom,
      attributionControl:false,
    });

    let inspectControl: IControl = ((new InspectControl({console:true}) as any) as IControl)
    this.map.addControl(inspectControl)
    this.map.addControl(this.draw);
    this.map.addControl (new TileBoundariesControl());
    // this.map.addControl(new SaveEditsControl());
    //to-do test
    // pass geometry in save edit control
        // this.map.addControl(new SaveEditsControl(geometry));

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
            (this.map.getSource('point-draw-source') as GeoJSONSource).setData(pointData);


          break;

          default:

        }

        this.draw.delete(feature.id)
    });

      this.map.on('contextmenu',(event)=>{

        if(this.isEditing){
          return
        }

      let selectedFeatures =  this.map.queryRenderedFeatures(event.point);
      let drawFeatures = selectedFeatures.filter(feature=>(feature.source=='polygon-draw-source' || feature.source=='line-draw-source' || feature.source=='point-draw-source') )
      if (drawFeatures && drawFeatures.length > 0) {
        let feature = drawFeatures[0];
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

      this.map.on('styleimagemissing',  (e)=> {
        var id = e.id; 
        
        this.map.addImage(id, transparentIcon());
        });

  }




  addFeatureOptionPopup(event,feature){
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
      this.draw.changeMode('direct_select',{featureId:this.draw.add(this.currentEditFeature)[0]})
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

      !this.sidenav.opened && this.sidenav.open();

      this.selectedTab=2;
      this.currentPropertiesFeature = feature
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

        featureOptionPopup.remove();

        // to-do handle properties tab when feature delete 

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
          break;

      }

    this.draw.deleteAll();
    this.isEditing=false;

  }


  onPropertiesChanged(e){

if(this.currentPropertiesFeature.geometry==undefined){
  return
}

let properties ={};
e.VORows.forEach(row=>{
  properties[row['property']]=row.value
})


let feature ={
  "type": "Feature",
  "geometry":this.currentPropertiesFeature._geometry ,
  "properties": properties
}

let index;

switch (this.currentPropertiesFeature.geometry.type) {
  case 'Polygon':
    let polygonData:any =( this.map.getSource('polygon-draw-source') as GeoJSONSource)._data;
     index =   polygonData.features.findIndex(f=>f.properties.id==this.currentPropertiesFeature.properties.id);
    polygonData.features.splice(index,1,feature); 

    setTimeout(() => {
      feature.geometry = this.currentPropertiesFeature._geometry ;
      (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData(polygonData);
    }, 1000);
    break;

  case "LineString":
    let lineData:any =( this.map.getSource('line-draw-source') as GeoJSONSource)._data;
     index =   lineData.features.findIndex(f=>f.properties.id==this.currentPropertiesFeature.properties.id);
    lineData.features.splice(index,1,feature); 

    setTimeout(() => {
      feature.geometry = this.currentPropertiesFeature._geometry ;
      (this.map.getSource('polygon-draw-source') as GeoJSONSource).setData(lineData);
    }, 100);
  break;

  case "Point":
    let pointData:any =( this.map.getSource('point-draw-source') as GeoJSONSource)._data;
     index =   pointData.features.findIndex(f=>f.properties.id==this.currentPropertiesFeature.properties.id);
    pointData.features.splice(index,1,feature); 

    setTimeout(() => {
      feature.geometry = this.currentPropertiesFeature._geometry ;
      (this.map.getSource('point-draw-source') as GeoJSONSource).setData(pointData);
    }, 100);
  break;

  default:
      break;
}


  }

  setEditorContent(e){
    console.log(e)
  }

  codeMirrorLoaded(){
   this.codeMirror.codeMirror.setSize(null,'auto');
  }

}
