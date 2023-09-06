import { Injectable, OnChanges, SimpleChanges,OnInit } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { MAP_DATA_META, PROPERTIES } from './shared/enum';
import { GeoJSONSource, Map } from 'maplibre-gl';


@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  map:Map
  private  selection = new SelectionModel<any>(true, [],true,(o1,o2)=>o1==o2);


  selectFeatureFromMap(feature){
    this.selection.select(feature.properties[PROPERTIES.MAPCALC_ID]);
  }

  selectFeaturesFromList(feature){
    const popups = document.getElementsByClassName('maplibregl-popup');
      for (var i = 0; i < popups.length; i++) {
        popups[i].remove();
      }
    this.selection.select(feature.properties[PROPERTIES.MAPCALC_ID]);

  }

  clearSelection(){
  this.selection.clear()
  }

  toggle(feature){
  this.selection.toggle(feature.properties[PROPERTIES.MAPCALC_ID])
  }

  get selected(){
    return this.selection.selected;
  }

  isSelected(feature){
    return this.selection.isSelected(feature.properties[PROPERTIES.MAPCALC_ID])
  }

  selectionChanged(){
    return this.selection.changed
  }

  contextMenuAction = new Subject<any>()

  constructor() { }
}
