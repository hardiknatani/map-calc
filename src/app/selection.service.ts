import { Injectable } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { MAP_DATA_META, PROPERTIES } from './shared/enum';


@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  selection = new SelectionModel<any>(true, [],true,(o1,o2)=>o1['properties'][PROPERTIES.MAPCALC_ID]==o2['properties'][PROPERTIES.MAPCALC_ID]);

  contextMenuAction = new Subject<any>()

  constructor() { }
}
