import { formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {AfterViewInit,ChangeDetectorRef,Component,ElementRef,OnDestroy,OnInit,ViewChild,ViewEncapsulation,ViewChildren,QueryList} from '@angular/core';
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
import  {Editor,} from 'codemirror';
import { normalize, validate } from './geojsonHelpers';
import { MAP_DATA_META, PROPERTIES } from './shared/enum';
import * as turf from '@turf/turf'
import {MatMenuTrigger} from '@angular/material/menu'
import { SelectionService } from './selection.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map;

  @ViewChild('map', { static: true })
  private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('sidenav', { static: true }) sidenav!: MatSidenav;
  @ViewChild('codeMirror', { static: true }) editor!: Editor;
  @ViewChild('trigger') trigger: MatMenuTrigger;

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
  drawControlOptions: MapboxDraw.MapboxDrawOptions = {
    displayControlsDefault: false,
    userProperties: true,
    modes: {
      ...MapboxDraw.modes,
      draw_rectangle: DrawRectangle,
      draw_circle: DragCirceMode,
      static: StaticMode,
    },
    controls: {
      line_string: true,
      polygon: true,
      point: true,
    },
  };
  layersStyle: any;
  draw: any = new MapboxDraw(this.drawControlOptions) as any as IControl;

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
  };

  geojsonText = `  {
  "type": "FeatureCollection",
  "features": []
} `;

  listFeatures:any[]=[];  

panelStructure:'list'|'json' =  'list'

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private bottomSheet: MatBottomSheet,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private selectionService:SelectionService
  ) {}

  getBoundsFromTitler(layer) {
    let url = `${environment.titiler_base_url}/mosaicjson/bounds?url=${layer.url}`;
    // let url = `http://localhost:8000/bounds?url=${layer.url}`

    return this.http.get(url);
  }

  ngOnInit(): void {
    this.initMap();
    let drawCtrl = Array.from(
      document.getElementsByClassName('mapboxgl-ctrl-group')
    ).filter((ele) =>
      ele.children[0].classList.contains('mapbox-gl-draw_ctrl-draw-btn')
    )[0];
    let rectangleButton = document.createElement('button');
    rectangleButton.classList.add('mapbox-gl-draw_ctrl-draw-btn');
    rectangleButton.classList.add('mapbox-gl-draw_rectangle');
    rectangleButton.addEventListener('click', () => {
      if (this.draw.getMode() != 'draw_rectangle') {
        this.draw.changeMode('draw_rectangle');
      } else {
        this.draw.changeMode('static');
      }
    });
    drawCtrl.appendChild(rectangleButton);

    let circleButton = document.createElement('button');
    circleButton.classList.add('mapbox-gl-draw_ctrl-draw-btn');
    circleButton.classList.add('mapbox-gl-draw_circle');
    circleButton.addEventListener('click', () => {
      if (this.draw.getMode() != 'draw_circle') {
        this.draw.changeMode('draw_circle');
      } else {
        this.draw.changeMode('simple_select');
      }
    });
    drawCtrl.appendChild(circleButton);

    this.selectionService.selectionChanged.subscribe((data:any)=>{

      console.log(data.selected)
          this.highlightFeature(data.selected)
          this.map.triggerRepaint();

    })

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

  generateRandomColor() {
    let newColor = '#' + Math.floor(Math.random() * 900000 + 100000).toString();
    return newColor;
  }

  parseFilter(v: any) {
    let tryParseInt = (v: any) => {
      if (v === '') return v;
      if (isNaN(v)) return v;
      return parseFloat(v);
    };

    let tryParseBool = (v: any) => {
      const isString = typeof v === 'string';
      if (!isString) {
        return v;
      }

      if (v.match(/^\s*true\s*$/)) {
        return true;
      } else if (v.match(/^\s*false\s*$/)) {
        return false;
      } else {
        return v;
      }
    };

    v = tryParseInt(v);
    v = tryParseBool(v);
    return v;
  }

  showSettings(layer) {
    this.selectedConfigLayer = layer;
    this.showControls = true;
  }

  toggleSidebar() {
    const id = 'right';
    let elem = document.getElementById(id) as any;
    let classes = elem.className.split(' ');
    let collapsed = classes.indexOf('collapsed') !== -1;

    let padding = {};

    if (collapsed) {
      classes.splice(classes.indexOf('collapsed'), 1);

      padding[id] = 300;
    } else {
      padding[id] = 0;
      classes.push('collapsed');
    }
    elem.className = classes.join(' ');
  }

  initMap() {
    const initialState = {
      lng: 5.339355468750009,
      lat: 60.02369688198334,
      zoom: 1,
    };

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/5bbd1a63-591a-469a-bdaa-c89c18c32654/style.json?key=${this.API_KEY}`,
      center: [5.596785544036919, 60.019994761409535],
      zoom: initialState.zoom,
      attributionControl: false,
    });

    let inspectControl: IControl = new InspectControl({
      console: true,
    }) as any as IControl;
    this.map.addControl(inspectControl);
    this.map.addControl(this.draw);
    this.map.addControl(new TileBoundariesControl());
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
      feature['properties'][PROPERTIES.MAPCALC_ID] = Math.floor( Math.random() * 900000 + 100000);
      data.features.push(feature);
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
      this.draw.delete(feature.id);

      this.updatePanel()
    });

    this.map.on('contextmenu', (event) => {
      if (this.isEditing) {
        return;
      }

      let selectedFeatures = this.map.queryRenderedFeatures(event.point);
      let drawFeatures = selectedFeatures.filter(
        (feature) => feature.source == MAP_DATA_META.MAP_DATA_SOURCE
      );
      if (drawFeatures && drawFeatures.length > 0) {
        let feature = drawFeatures[0];
        this.addFeatureOptionPopup(event, feature);
      }
    });

    this.map.on('style.load', () => {
      this.map.addSource(MAP_DATA_META.MAP_DATA_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: MAP_DATA_META.FILL_LAYER,
        type: 'fill',
        source: MAP_DATA_META.MAP_DATA_SOURCE,
        paint: {
          'fill-color': '#E21818',
          'fill-opacity': 0.5,
          'fill-outline-color': '#F84C4C',
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
          'icon-size': 1,
          'icon-image': 'mapbox-marker-icon-red',
        },
        filter: ['==', ['geometry-type'], 'Point'],
      });

      this.map.addSource("selection-source",{
        type:'geojson',
        data:{
        type:"FeatureCollection",
        features:[]
      }});
        this.map.addLayer({
          'id': 'selection-polygon',
          'type': 'fill',
          'source': 'selection-source',
          'paint': {
          'fill-color':  '#FFED00',
          "fill-opacity":0.5,
        'fill-outline-color':'#FFED00'
          },
          filter: ['==', ['geometry-type'], 'Polygon'],

        })
        this.map.addLayer({
          'id': 'selection-line',
          'type': 'line',
          'source': 'selection-source',
          'paint': {
          'line-color':  '#FFED00',
          "line-opacity":0.6,
        'line-width':2
          },
          filter: ['==', ['geometry-type'], 'LineString'],
        });

        this.map.addLayer({
          'id': 'selection-symbol',
          'type': 'symbol',
          'source': 'selection-source',
          layout: {
            'icon-size': 1,
            'icon-image': 'mapbox-marker-icon-yellow',
          },
          filter: ['==', ['geometry-type'], 'Point'],

        });
    });

    this.map.on('styleimagemissing', (e) => {
      var id = e.id;

      this.map.addImage(id, transparentIcon());
    });


  }

  addFeatureOptionPopup(event, feature) {
    let options = document.createElement('div');

    let editButton = document.createElement('button');
    editButton.innerHTML = 'Edit';
    editButton.addEventListener('click', () => {
      let data: any;
      this.currentEditFeature;
      data = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
      this.currentEditFeature = data.features.find((ele) =>ele.properties[PROPERTIES.MAPCALC_ID] ==feature.properties[PROPERTIES.MAPCALC_ID]);
      data = data.features.filter((ele) =>ele.properties[PROPERTIES.MAPCALC_ID] !== feature.properties[PROPERTIES.MAPCALC_ID]);
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource
      ).setData({
        type: 'FeatureCollection',
        features: data,
      });

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
      !this.sidenav.opened && this.sidenav.open();

      this.selectedTab = 2;
      this.currentPropertiesFeature = feature;
      featureOptionPopup.remove();
    });

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
    options.append(editButton, infoButton, propertiesButton, deleteButton);

    let featureOptionPopup = new maplibregl.Popup({
      closeOnClick: true,
      closeButton: false,
      anchor: 'left',
    })
      .setLngLat(event.lngLat)
      .setDOMContent(options);
    featureOptionPopup.addClassName('featureOptionsPopup');

    const popups = document.getElementsByClassName('featureOptionsPopup');
    if (popups.length) {
      popups[0].remove();
      featureOptionPopup.addTo(this.map);
    } else {
      featureOptionPopup.addTo(this.map);
    }

    featureOptionPopup.addClassName('featureOptionsPopup');
  }

  onToggleEdit(action: string) {
    let feature = action == 'save' ? this.draw.getAll().features[0]: this.currentEditFeature;
    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
    data.features.push(feature);
    (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);

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
      geometry: this.currentPropertiesFeature._geometry,
      properties: properties,
    };

    let index;

    let data: any = (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data;
    index = data.features.findIndex((f) =>f.properties[PROPERTIES.MAPCALC_ID] == this.currentPropertiesFeature.properties[PROPERTIES.MAPCALC_ID]);
    data.features.splice(index, 1, feature);

    setTimeout(() => {
      feature.geometry = this.currentPropertiesFeature._geometry;
      (this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource).setData(data);
    }, 1000);
  }

  codeMirrorLoaded() {
    this.editor = (this.editor as any).codeMirror;
    this.editor.setSize("100%", "100%");
  }

  handleChange(e) {
    if (!e.length) return;
    let value = e;
    validate(value, this.editor);
  }

  updateEditorGeojson(){
  this.editor.setValue( JSON.stringify((this.map.getSource(MAP_DATA_META.MAP_DATA_SOURCE) as GeoJSONSource)._data,null,2));
  this.editor.refresh()
  }

  onPanelStructureChanged(e){
    if(e.checked){
      this.updateEditorGeojson();
      this.panelStructure='json';
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
    console.log(this.listFeatures)
  }

  highlightFeature(features?){
    let data: any = {
      'type': 'FeatureCollection',
      'features': []
    };

    if (features.length > 0) {
      features.forEach(feature => {
        data.features.push(feature);
      });}
      console.log(data);
      (this.map.getSource('selection-source') as GeoJSONSource).setData(data)
      this.map.moveLayer('selection-polygon');
      this.map.moveLayer('selection-line');
      this.map.moveLayer('selection-symbol');

    
  }

  zoomToAndHighlightFeature(features:any , layerId?) {
    let data: any = {
      'type': 'FeatureCollection',
      'features': []
    };

    if (features.length > 0) {
      features.forEach(feature => {
        data.features.push(feature);
      });
      (this.map.getSource('selection-source') as GeoJSONSource).setData(data)
      let bbox: any = turf.bbox(data);
      this.map.fitBounds((bbox as any), {
        padding: 5, zoom: 0.5, linear: true, speed: 5, animate: true
      });
      this.map.moveLayer('selection-polygon');
      this.map.moveLayer('selection-line');


    }else{
      (this.map.getSource('selection-source') as GeoJSONSource).setData(data)

    }
  }


}
