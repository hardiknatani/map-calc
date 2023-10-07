import { formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {AfterViewInit,ChangeDetectorRef,Component,ElementRef,OnDestroy,OnInit,ViewChild,ViewEncapsulation,ViewChildren,QueryList} from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSlider } from '@angular/material/slider';
import  MapboxDraw from '@hardiknatani/mapbox-gl-draw'
import { DrawCreateEvent } from '@mapbox/mapbox-gl-draw';
import  InspectControl  from './shared/maplibre-custom-controls/InspectControl/InspectControl';
import { IControl, GeoJSONSource, Map } from 'maplibre-gl';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { lastValueFrom } from 'rxjs';
import { API_KEY,basemaps,borderAndAreasLayers,colormaps, transparentIcon} from './shared/map.common';
import * as maplibregl from 'maplibre-gl';
import { environment } from '../environments/environment';
import TileBoundariesControl from './shared/maplibre-custom-controls/TileBoundariesControl';
import { TileUtils } from './shared/tileutils';
import MeasuresControl from 'maplibre-gl-measures';
import DrawRectangle from './shared/draw-custom-modes/rectangle/rectangle';
import DragCirceMode from './shared/draw-custom-modes/circle/modes/DragCircleMode';
import StaticMode from './shared/draw-custom-modes/static/Static';
import SaveEditsControl from './shared/maplibre-custom-controls/EditSaveControl';
import  {Editor, LineHandle,} from 'codemirror';
import { generateMapcalcId, normalize, validate } from './geojsonHelpers';
import { MAP_DATA_META, PROPERTIES } from './shared/enum';
import * as turf from '@turf/turf'
import { SelectionService } from './selection.service';
import PropertiesControl from './shared/maplibre-custom-controls/PropertiesControl';
import { NgxSpinnerService } from "ngx-spinner";
import { ActionParamFormComponent } from './action-param-form/action-param-form.component';
import { EditorDialogComponent } from './editor-dialog/editor-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map;

  @ViewChild('mapContainer', { static: true })
  private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;
  @ViewChild('codeMirror', { static: true }) editor!: Editor;
  @ViewChild('importInput', { static: true }) importInput!: ElementRef<HTMLInputElement>;
  turf = turf;
  Number=Number
  selectedTab: any;
  // @BlockUI() blockUI: NgBlockUI;
  mapControls: any;
  showFiller = false;
  selectedConfigLayer: any = null;
  basemaps = basemaps;
  borderAndAreasLayers = borderAndAreasLayers;
  colormaps = colormaps;
  selectedColorramp = new FormControl('Default');
  API_KEY = environment.maptilerApiKey;
  bufferRadius = new FormControl();
  drawControlOptions = {
    displayControlsDefault: false,
    userProperties: true,
    modes: {
      ...MapboxDraw.modes,
    },
    controls: {
      line_string: true,
      polygon: true,
      point: true,
    },
  };
  layersStyle: any;
  draw: any = new  MapboxDraw(this.drawControlOptions) as any as IControl;
  propertiesControl = new PropertiesControl()

  showControls = false;
  selectedFeature: any;
  tileUtils = new TileUtils();

  tileUrl: String = '';
  createTileKey(tileIndex) {
    return `${tileIndex.zoom}_${tileIndex.y}_${tileIndex.x}`;
  }

  isEditing = false;
  currentEditFeature: any;
  currentPropertiesFeature: any = {
    properties: {},
  };

  codeMirrorOptions: any = {
    mode: { name: 'javascript', json: true },
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    lineWrapping: false,
    extraKeys: { 'Ctrl-Space': 'autocomplete' },
    foldGutter: true,
    gutters: [
      'error',
      'CodeMirror-linenumbers',
      'CodeMirror-foldgutter',
      'CodeMirror-lint-markers',
    ],
    value: '',
    autoCloseBrackets: true,
    matchBrackets: true,
    theme: 'eclipse',
    readOnly:true
  };

  geojsonText = `  {
  "type": "FeatureCollection",
  "features": []
} `;

  listFeatures:any[]=[];  

  topbarActions:any[]=[]

  panelStructure:'list'|'json' =  'json';

get selected(){
  return this.selectionService.selected
}

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private bottomSheet: MatBottomSheet,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private selectionService:SelectionService,
    private ngxSpinner:NgxSpinnerService
  ) {}


  ngOnInit(): void {
    this.initMap();

    this.selectionService.selectionChanged().subscribe((_:any)=>{

      if(this.selectionService.selected.length==1){
        let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
        this.currentPropertiesFeature=data.features.find(f=>f.properties[PROPERTIES.MAPCALC_ID]==this.selectionService.selected[0]);
      }

      let data:any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      let features =  data.features.map(f=>{
        this.selectionService.selected.includes(f.properties[PROPERTIES.MAPCALC_ID])
          ?f.properties['selected']=true
          :f.properties['selected']=false;
        
        return f
      });
    
    (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData({type: 'FeatureCollection',features: features});
    
    this.updateTopbarOptions()

    });

    this.selectionService.contextMenuAction.subscribe(action=>this.onContextMenuAction(action))

  }
  ngOnDestroy() {
    if (this.bottomSheet._openedBottomSheetRef) {
      this.bottomSheet.dismiss();
    }
    [...this.borderAndAreasLayers].forEach((layer) => {
      if (layer.active) layer.active = false;
    });
  }
  ngAfterViewInit(): void {}

  updateTopbarOptions(){

      let data:any =  (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      let selectedFeatures=data.features.filter(ele=>this.selectionService.selected.includes(ele['properties'][PROPERTIES.MAPCALC_ID]))
        if(selectedFeatures.length==0){
          this.topbarActions=[]
        }
      if(selectedFeatures.length>0 && selectedFeatures.length==1){
        this.topbarActions.push({viewValue:'Create Rectangular Envelope',value:'envelope',icon:"fg-bbox-alt",type:'button',visible:true});
        this.topbarActions.push({viewValue:'Create Buffer',value:'buffer',icon:"fg-buffer",type:'button',visible:true});

        this.topbarActions = this.topbarActions.filter(ele=>!ele.value?.includes('merge'))
      }if(selectedFeatures.length>1){
        this.topbarActions = this.topbarActions.filter(ele=>!ele.value?.includes('merge') && !ele.value?.includes('intersection'))


        if(selectedFeatures.every(ele=>ele.geometry.type=='Polygon'||ele.geometry.type=='MultiPolygon')){
          this.topbarActions.push({viewValue:'Merge into MultiPolygon',value:'merge',icon:"fg-union",type:'button',visible:true});
          this.topbarActions.push({viewValue:'Intersection',value:'intersection',icon:"fg-intersection",type:'button',visible:true});
          this.cdr.detectChanges();
          return
        }
        else if(  selectedFeatures.every(ele=>ele.geometry.type=='LineString'||ele.geometry.type=='MultiLineString')){
          this.topbarActions.push({viewValue:'Merge into MultiLineString',value:'merge',icon:"fg-union",type:'button',visible:true});
          this.cdr.detectChanges();

          return

        }else if(  selectedFeatures.every(ele=>ele.geometry.type=='Point'||ele.geometry.type=='MultiPoint')){
          this.topbarActions.push({viewValue:'Merge into MultiLineString',value:'merge',icon:"fg-union",type:'button',visible:true});
          this.cdr.detectChanges();

          return

        }
      }

  }

  handleLayerVisibility(layerData, setActive) {
    let source = this.map.getSource(layerData.id);
    if (!source) {
      this.map.addSource(layerData.id, {
        type: layerData['type'],
        tiles: layerData.tiles,
        ...(layerData.bounds && { bounds: layerData.bounds }),
        ...(layerData.volatile && { volatile: layerData.volatile }),
        ...(layerData.type == 'raster' && { tileSize: 512 }),
      });
      const layer = this.map.getLayer(layerData.sourceLayer.id);

      if (!layer) {
        this.map.addLayer({
          id: layerData.sourceLayer.id,
          type: layerData.sourceLayer.type,
          source: layerData.id,
          'source-layer': layerData.sourceLayer.sourceLayer,
          filter: ['all'],
          paint: layerData.paint,
          layout: layerData.layout ? layerData.layout : {},
          metadata: {
            name: layerData.name,
          },
        });
      }
    }

    const visibility = this.map.getLayoutProperty(
      layerData.sourceLayer.id,
      'visibility'
    );

    if (visibility === 'visible') {
      this.map.setLayoutProperty(
        layerData.sourceLayer.id,
        'visibility',
        'none'
      );
    } else {
      this.map.setLayoutProperty(
        layerData.sourceLayer.id,
        'visibility',
        'visible'
      );
    }
    // });

    if (setActive) layerData.active = !layerData.active;
  }

  toggleSidebar() {
    const id = 'right-sidebar';
    let elem = document.getElementById(id);
    let display = elem?.style.display;

    if(display == null || display == '' || display=='none' ){
      elem?.style.setProperty('display','block');
    }else if(display=='block'){
      elem?.style.setProperty('display','none');

    }


  }

  initMap() {
    const initialState = {
      lng: 5.339355468750009,
      lat: 60.02369688198334,
      zoom: 1,
    };

    (
      document.getElementById('position-info') as any
    ).innerHTML = `<b>Lat: </b>${Number(initialState.lat).toFixed(
      5
    )}, <b>Lng: </b>${Number(initialState.lng).toFixed(5)}`;
    (document.getElementById('zoom-info') as any).innerHTML =
    '<b>Zoom</b>: ' + Number(initialState.zoom).toFixed(2);
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/5bbd1a63-591a-469a-bdaa-c89c18c32654/style.json?key=${this.API_KEY}`,
      center: [5.596785544036919, 60.019994761409535],
      zoom: initialState.zoom,
      attributionControl: false,
    });

    let inspectControl: IControl = new InspectControl({
      console: false,
    }) as any as IControl;
    this.map.addControl(inspectControl);
    this.map.addControl(this.draw);
    // this.map.addControl(new TileBoundariesControl());
    this.map.addControl(this.propertiesControl,'bottom-right')
    // this.map.addControl(new SaveEditsControl());
    //to-do test
    // pass geometry in save edit control
    // this.map.addControl(new SaveEditsControl(geometry));

    let that = this;

    this.map.on('mousemove', function (e) {
      (
        document.getElementById('position-info') as any
      ).innerHTML = `<b>Lat: </b>${Number(e.lngLat.lat).toFixed(
        5
      )}, <b>Lng: </b>${Number(e.lngLat.lng).toFixed(5)}`;
    });

    this.map.on('zoom', (e) => {
      (document.getElementById('zoom-info') as any).innerHTML =
        '<b>Zoom</b>: ' + Number(this.map.getZoom()).toFixed(2);
    });

    this.map.on('draw.create', (e) => {
      let feature = e.features[0];
      let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      feature['properties'][PROPERTIES.MAPCALC_ID] = generateMapcalcId();
      data.features.push(feature);
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
      this.draw.delete(feature.id);

      this.updatePanel()
    });

    this.map.on('contextmenu', (event) => {
      if (this.isEditing) {
        return;
      }

      let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;

      let filteredFeatureIds =[...new Set( (this.map.queryRenderedFeatures(event.point) as any).filter((ele,i)=>ele.source==MAP_DATA_META.MAP_DATA_SOURCE).map(ele=>ele.properties[PROPERTIES.MAPCALC_ID]))];

      if (filteredFeatureIds && filteredFeatureIds.length ==1) {
        let feature = data.features.find(f=>f.properties[PROPERTIES.MAPCALC_ID]==filteredFeatureIds[0]);
        this.selectionService.clearSelection();
        this.selectionService.selectFeatureFromMap(feature);
        this.addFeatureOptionPopup(event, feature);
      }

      if (filteredFeatureIds && filteredFeatureIds.length >1) {
        this.addMultipleFeaturePopup(data,filteredFeatureIds,event)
      }
    });

    this.map.on('style.load', () => {
      this.map.addSource(MAP_DATA_META.MAP_DATA_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        generateId:true,
        maxzoom:24,
        tolerance:0
      });

      this.map.addLayer({
        id: MAP_DATA_META.FILL_LAYER,
        type: 'fill',
        source: MAP_DATA_META.MAP_DATA_SOURCE,
        paint: {
          'fill-color': '#E21818',
          'fill-opacity': ['case',
           ['==', ['get', 'selected'], true],
            1,
           0.5],
          'fill-outline-color': '#FFED00',
          // 'fill-antialias': false,
        },
        filter: ['==', ['geometry-type'], 'Polygon'],
      });

      this.map.addLayer({
        id: MAP_DATA_META.FILL_BORDER_LAYER,
        type: 'line',
        source: MAP_DATA_META.MAP_DATA_SOURCE,
        paint: {
          'line-color': '#E21818',
          'line-opacity':['case',
          ['==', ['get', 'selected'], true],
           1,
          0.5] ,
           "line-width":['case',
           ['==', ['get', 'selected'], true],
            2.5,
           1.5]
          // 'fill-antialias': false,
        },
        filter: ['==', ['geometry-type'], 'Polygon'],
      });

      this.map.addLayer({
        id: MAP_DATA_META.LINE_LAYER,
        type: 'line',
        source: MAP_DATA_META.MAP_DATA_SOURCE,
        paint: {
          'line-color': 'red',
          'line-width': 5,
          'line-opacity':['case',
          ['==', ['get', 'selected'], true],
           1,
          0.5],
        },
        filter: ['==', ['geometry-type'], 'LineString'],
      });

      this.map.addLayer({
        id: MAP_DATA_META.SYMBOL_LAYER,
        type: 'symbol',
        source: MAP_DATA_META.MAP_DATA_SOURCE,
        paint: {
          'icon-opacity': 1,
        },
        layout: {
          'icon-image': 'mapbox-marker-icon-red',
          "icon-allow-overlap":true,
          "icon-ignore-placement":true,
          'icon-size':['case',
          ['==', ['get', 'selected'], true],
           1.5,
          1],
        },
        filter: ['==', ['geometry-type'], 'Point'],
      });
    });
    
    this.map.on('styleimagemissing', (e) => {
      var id = e.id;

      this.map.addImage(id, transparentIcon());
    });

    this.map.on('togglePropertiesSideBar',()=>{
      this.toggleSidebar()
    })

    this.map.on('sourcedata',(e)=>{
      if(e.sourceId!=MAP_DATA_META.MAP_DATA_SOURCE)
      return


      if(this.map.isSourceLoaded(MAP_DATA_META.MAP_DATA_SOURCE)){
        this.selectionService.map=this.map
      }
    })


  }

  addMultipleFeaturePopup(data,filteredFeatureIds,event){
    let features = data.features.filter((f) =>
      filteredFeatureIds.includes(f.properties[PROPERTIES.MAPCALC_ID])
    );
    let main = document.createElement('div');
    features.forEach((f) => {
      let btn = document.createElement('button');
      btn.innerHTML = `Select ${f.geometry.type}`;
      btn.addEventListener('mouseenter', (e) => {
        this.selectionService.selectFeatureFromMap(f);
      });
      btn.addEventListener('mouseout', (e) => {
        this.selectionService.clearSelection();
      });
      btn.addEventListener('click', (e) => {
        this.selectionService.clearSelection();
        this.selectionService.selectFeatureFromMap(f);
        this.addFeatureOptionPopup(event, f);
      });
      main.appendChild(btn);
    });

    main.className = 'options-buttons';
    let featuresPopup = new maplibregl.Popup({
      closeOnClick: true,
      closeButton: false,
      anchor: 'left',
    })
      .setLngLat(event.lngLat)
      .setDOMContent(main);
    featuresPopup.addClassName('featureOptionsPopup');
    const popups = document.getElementsByClassName('maplibregl-popup');
    for (var i = 0; i < popups.length; i++) {
      popups[i].remove();
    }
    featuresPopup.addTo(this.map);
  }

  addFeatureOptionPopup(event,feature) {
    let options = document.createElement('div');

    let editButton = document.createElement('button');
    editButton.innerHTML = 'Edit';
    editButton.addEventListener('click', () => {
      let data: any;
      this.currentEditFeature;
      data = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      this.currentEditFeature = data.features.find((ele) =>ele.properties[PROPERTIES.MAPCALC_ID] ==feature.properties[PROPERTIES.MAPCALC_ID]);
      
      this.map.setFilter(MAP_DATA_META.FILL_LAYER,['all',
        ['!=',['get',PROPERTIES.MAPCALC_ID], this.currentEditFeature.properties[PROPERTIES.MAPCALC_ID]],
        ['==', ['geometry-type'], 'Polygon']
      ]);
      this.map.setFilter(MAP_DATA_META.LINE_LAYER,['all',
        ['!=',['get',PROPERTIES.MAPCALC_ID], this.currentEditFeature.properties[PROPERTIES.MAPCALC_ID]],
        ['==', ['geometry-type'], 'LineString']
      ]); 
        this.map.setFilter(MAP_DATA_META.SYMBOL_LAYER,['all',
        ['!=',['get',PROPERTIES.MAPCALC_ID], this.currentEditFeature.properties[PROPERTIES.MAPCALC_ID]],
        ['==', ['geometry-type'], 'Point']
      ]);

      this.draw.deleteAll();
      this.isEditing = true;
      this.draw.changeMode('direct_select', {
        featureId: this.draw.add(this.currentEditFeature)[0],
      });
      featureOptionPopup.remove();
    });

    let infoButton = document.createElement('button');
    infoButton.innerHTML = 'Info';
    infoButton.addEventListener('click', () => {
      featureOptionPopup.remove();
    });

    let propertiesButton = document.createElement('button');
    propertiesButton.innerHTML = 'Properties';
    propertiesButton.addEventListener('click', () => {
      const id = 'right-sidebar';
      let elem = document.getElementById(id);
      let display = elem?.style.display;
  
        elem?.style.setProperty('display','block');

      // this.currentPropertiesFeature = feature;
      featureOptionPopup.remove();
    });

    let splitButton = document.createElement('button');

    if(feature.geometry.type.includes('Multi')){
      splitButton.innerHTML = `Split into ${feature.geometry.type.slice(5,feature.geometry.type.length)}s`;
      splitButton.addEventListener('click', () => {
        this.onContextMenuAction('split');
        featureOptionPopup.remove();
      });
    }

    let deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.addEventListener('click', () => {
      let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      data = data.features.filter( (ele) => ele.properties[PROPERTIES.MAPCALC_ID] !==feature.properties[PROPERTIES.MAPCALC_ID]);
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData({type: 'FeatureCollection',features: data});
        this.updatePanel()
      featureOptionPopup.remove();

      // to-do handle properties tab when feature delete
    });

    options.className = 'options-buttons';
    options.append(editButton, propertiesButton, );

    if(feature.geometry.type.includes('Multi')){
      options.append(splitButton)
    };

    options.append(deleteButton);

    let featureOptionPopup = new maplibregl.Popup({
      closeOnClick: true,
      closeButton: false,
      anchor: 'left',
    })
      .setLngLat(event.lngLat)
      .setDOMContent(options);
    featureOptionPopup.addClassName('featureOptionsPopup');

    const popups = document.getElementsByClassName('maplibregl-popup');
      for (var i = 0; i < popups.length; i++) {
        popups[i].remove();
      }
    featureOptionPopup.addTo(this.map);
    featureOptionPopup.addClassName('featureOptionsPopup');
  }

  onToggleEdit(action: string) {

    if(action=='save'){
    let feature = action == 'save' ? this.draw.getAll().features[0]: this.currentEditFeature;
    feature.properties.selected=false;
    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
    data.features = data.features.filter(f=>
      f.properties.mapcalc_id!=this.currentEditFeature.properties.mapcalc_id
    )
    data.features.push(feature);
    (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);

    }else if(action=='cancel'){

    }

    this.map.setFilter(MAP_DATA_META.FILL_LAYER, ['==', ['geometry-type'], 'Polygon']);
    this.map.setFilter(MAP_DATA_META.LINE_LAYER, ['==', ['geometry-type'], 'LineString']);
    this.map.setFilter(MAP_DATA_META.SYMBOL_LAYER, ['==', ['geometry-type'], 'Point']);

    this.draw.deleteAll();
    this.isEditing = false;
    this.updatePanel()
  }

  onPropertiesChanged(e) {
    if (this.currentPropertiesFeature.geometry == undefined) {
      return;
    }

    let properties = {};
    e.VORows.forEach((row) => {
      properties[row['property']] = row.value;
    });

    let feature = {
      type: 'Feature',
      geometry: this.currentPropertiesFeature.geometry,
      properties: properties,
    };

    let index;

    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
    index = data.features.findIndex((f) =>f.properties[PROPERTIES.MAPCALC_ID] == this.currentPropertiesFeature.properties[PROPERTIES.MAPCALC_ID]);
    data.features.splice(index, 1, feature);

    // setTimeout(() => {
      feature.geometry = this.currentPropertiesFeature.geometry;
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
    // }, 1000);
  }

  codeMirrorLoaded() {
    this.editor = (this.editor as any).codeMirror;
    this.editor.setSize("20vw", "95vh");
  }


  updateEditorGeojson(){
  this.editor.setValue( JSON.stringify((this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data,null,2));
  this.editor.eachLine( (lineHandle:LineHandle)=> {
    var lineText = lineHandle.text;
    if (lineText.includes('"mapcalc_id"') || lineText.includes('"selected"')) {
        this.editor.addLineClass(lineHandle, "background", "disabled-line");
    }

    // if(lineText.includes('coordinates')){
    //   // this.editor.f
    //   console.log(lineHandle);
    //   this.editor
    // }
});
    this.editor.refresh();
  }

  onPanelStructureChanged(e){
    if(e.checked){
      this.updateEditorGeojson();
      this.panelStructure='json';
      this.editor.refresh();
      this.cdr.detectChanges()
    }
    else{
      this.panelStructure='list'
    }
  }

  updatePanel(){
    this.listFeatures = ((this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data as any).features;
    this.updateEditorGeojson();
    this.cdr.detectChanges()
  }

  onEditDialog(){
    this.dialog.open(EditorDialogComponent,{
      data:this.editor.getValue(),
      panelClass:'editor-dialog',
      autoFocus:false,
      disableClose:true,
      closeOnNavigation:true
    }).afterClosed().subscribe(data=>{
      let gjson = JSON.parse(data);
      gjson.features.forEach(ele=>{
        if(!ele.properties.hasOwnProperty('mapcalc_id')){
          ele.properties.mapcalc_id=generateMapcalcId();
        }
      });
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(gjson);
      this.zoomTo(gjson.features)
      this.updatePanel()

    })
  }

  zoomTo(features:any[] ) {
    let data: any = {
      'type': 'FeatureCollection',
      'features': []
    };

    if (features.length > 0) {
      features.forEach(feature => {
        data.features.push(feature);
      });
      let bbox: any = turf.bbox(data);
      this.map.fitBounds((bbox as any), {
         linear: true, speed: 5, animate: true,maxZoom:17
      });
      // this.map.setZoom(this.map.getZoom()-0.5)
    }
  }

  readFile(e){
    this.ngxSpinner.show()
    let file = (this.importInput.nativeElement.files as any)[0];
    if(!file)
    return;
    let that = this
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileContent = (event.target as any).result;

      try {
          const jsonObject = JSON.parse(fileContent);
         let geojson = normalize(jsonObject);
         if(geojson.features.length>0){
          geojson.features.forEach(feature=>{
            if(!Object.keys(feature).includes('properties')){
              feature['properties']={
                mapcalc_id:generateMapcalcId()
              }
            }else{
              feature['properties'][PROPERTIES.MAPCALC_ID]=generateMapcalcId()
            }
          })
         }
          (that.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(geojson);
          that.updatePanel();
          that.zoomTo(geojson.features)
          that.ngxSpinner.hide()
        } catch (e) {
          that.ngxSpinner.hide()

          // displayError('Error parsing JSON file.');
      }
  };
  reader.readAsText(file);
  }

  onContextMenuAction(action){
    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;

  
    switch (action) {
      case 'zoom-to':
          this.zoomTo(data.features.filter(f=>this.selectionService.selected.includes(f.properties[PROPERTIES.MAPCALC_ID]) && f))
        break;
      case 'delete':
        data.features = data.features.filter(feature=>!this.selectionService.selected.includes(feature.properties.mapcalc_id));
        (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
        this.updatePanel();
        break;
        case 'buffer':
          this.dialog.open(ActionParamFormComponent,{data:{controls:['buffer-radius']},minWidth:"25vw",minHeight:"20vh"
          
        }).afterClosed().subscribe(dialogData=>{
          if(!dialogData || dialogData['buffer-radius']==null || dialogData['buffer-radius']==undefined)
          return
        // let f= data.features.find(f=>f.properties[PROPERTIES.MAPCALC_ID]==this.selectionService.selected[0]);
        data.features.forEach(f=>{
          if(this.selectionService.selected.includes(f.properties[PROPERTIES.MAPCALC_ID])){
            let buffer = turf.buffer(f,parseInt(dialogData['buffer-radius']),{units:'meters'});
            buffer.properties={};
            buffer.properties[PROPERTIES.MAPCALC_ID]=generateMapcalcId();
            data.features.push(buffer);
          }
        });
            (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
            this.updatePanel();
          })
          break;
          case 'duplicate':
          data.features.forEach(f=>{
            if(this.selectionService.isSelected(f)){
              let properties=JSON.parse(JSON.stringify(f.properties));
              properties['selected']=false;
              properties['mapcalc_id']=generateMapcalcId();

              data.features.push({
                type:'feature',
                geometry:f.geometry,
                properties
              })
            }
          });
          (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
            this.updatePanel()
          break;

          case "split":
            let feature = data.features.find(f=>f.properties[PROPERTIES.MAPCALC_ID]==this.selectionService.selected[0]);
            if(feature.geometry.type=="MultiPolygon"){
              feature.geometry.coordinates.forEach((coords)=>{
                let properties = JSON.parse(JSON.stringify(feature.properties));
                properties[PROPERTIES.MAPCALC_ID]=generateMapcalcId();
                data.features.push({properties:properties,geometry:{'type':'Polygon','coordinates':coords}});
                }
             );

            }else if (feature.geometry.type=="MultiLineString"){
              feature.geometry.coordinates.forEach((coords)=>{
                let properties = JSON.parse(JSON.stringify(feature.properties));
                properties[PROPERTIES.MAPCALC_ID]=generateMapcalcId();
                data.features.push({properties:properties,geometry:{'type':'LineString','coordinates':coords}});
                }
             );
            }else if(feature.geometry.type=="MultiPoint"){
              feature.geometry.coordinates.forEach((coords)=>{
                let properties = JSON.parse(JSON.stringify(feature.properties));
                properties[PROPERTIES.MAPCALC_ID]=generateMapcalcId();
                data.features.push({properties:properties,geometry:{'type':'Point','coordinates':coords}});
                }
             );
            }
            data.features= data.features.filter(f=>f['properties'][PROPERTIES.MAPCALC_ID]!=feature['properties'][PROPERTIES.MAPCALC_ID]);
            (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
            this.selectionService.clearSelection()
            this.updatePanel()
            break;
          case "merge":
          let newFeature:any=  turf.combine({
            "type": "FeatureCollection",
            "features": data.features.filter(ele=>this.selectionService.selected.includes(ele['properties'][PROPERTIES.MAPCALC_ID]))
          }).features[0];
          newFeature.properties={"mapcalc_id":generateMapcalcId()};
          data.features=data.features.filter(ele=>!this.selectionService.selected.includes(ele['properties'][PROPERTIES.MAPCALC_ID]));
          data.features.push(newFeature);
          (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
          this.updatePanel();
          break;

          case "intersection":
            let features = data.features.filter(ele=>this.selectionService.selected.includes(ele['properties'][PROPERTIES.MAPCALC_ID]));
            let intersection;

            for(let i=0;i<features.length-1;i++){
              if(!intersection){
                intersection=turf.intersect(features[i],features[i+1])
              }else{
                intersection=turf.intersect(intersection,features[i+1])
              }
            }
            if(intersection==null)
            return
            intersection.properties={
              'mapcalc_id':generateMapcalcId()
            };
            data.features.push(intersection);
            (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);

            this.updatePanel();
            break;

          case 'envelope':
            let selectedFeatures=data.features.filter(ele=>this.selectionService.selected.includes(ele['properties'][PROPERTIES.MAPCALC_ID]));
            let gjson:any = {
              type:'FeatureCollection',
              features:selectedFeatures
            };
           let envelope =  turf.envelope(gjson);
          if(envelope){
            if(!envelope.properties){
              envelope.properties={}
            }
            envelope.properties['mapcalc_id']=generateMapcalcId();
          }
          data.features.push(envelope);
          
          (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
          this.updatePanel();
          break;
    
      default:
        break;
    }

  }

  downloadFile() {
    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "Mapcalc" + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

}
