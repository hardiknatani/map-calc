import { Injectable } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  selection = new SelectionModel<any>(true, []);

  contextMenuAction = new Subject<any>()

  constructor() { }
}
