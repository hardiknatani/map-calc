import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { SelectionService } from '../selection.service';

@Component({
  selector: 'app-feature-list',
  templateUrl: './feature-list.component.html',
  styleUrls: ['./feature-list.component.scss']
})
export class FeatureListComponent implements OnChanges {


  contextMenuActions=[
    {viewValue:'Zoom To',value:'zoom-to'},
    {viewValue:'Delete',value:'delete'}

  ]

  menuVisibility=false;
  @ViewChild('menu') menu:ElementRef<HTMLDivElement>
  @Input() features:any;


  constructor( private selectionService:SelectionService ){

  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  get selection(){
    return this.selectionService.selection
   };


   onRightClick(feature,e:any){
    e.stopPropagation();
    e.preventDefault();

    if(this.selection.selected.length>1 &&  this.selection.isSelected(feature) ){
      // show composite menu
    }else{
      this.selectFeature(feature,e);

    }
    


    this.showMenu(e);
  }

  selectFeature(feature,event){
    
    if(event.ctrlKey){
      this.selection.toggle(feature)
    }else{
      this.selection.clear()
      this.selection.select(feature)
    }

  }

  
  showMenu(e:PointerEvent){


    if(this.menuVisibility){
      this.menuVisibility=false;
    }

    this.menuVisibility=true; 

    this.repositionMenu(e)

  }

  repositionMenu(e:PointerEvent){
    this.menu.nativeElement.style.position='fixed';
    var divRect = this.menu.nativeElement.getBoundingClientRect();
    var divWidth = divRect.width;
    var divHeight = divRect.height;
    var divLeft = divRect.left;
    var divTop = divRect.top;

    let windowHeight = (document.querySelector('canvas.maplibregl-canvas') as any).getBoundingClientRect().height
    this.menu.nativeElement.style.top= (e.y - 20).toString()+'px';
    this.menu.nativeElement.style.left= (e.x +10).toString()+'px';

    if((windowHeight-e.y)<divHeight){
        let newTop = e.y - (divHeight - (windowHeight - e.y + 10));
        this.menu.nativeElement.style.top= newTop.toString()+'px';
        this.menu.nativeElement.style.left= (e.x ).toString()+'px';

    }
  }

  closeMenu(){
    this.menuVisibility=false;
  }
  onClickOutsideFeature(e){
    if(e.target.classList.contains('feature-list-item')){
      return
    }else{
      this.selection.clear(true)
    }
  }

  onContextMenuAction(action,e){
    e.preventDefault();
    e.stopPropagation();
    this.selectionService.contextMenuAction.next(action);
    this.closeMenu()
  }
  
}
