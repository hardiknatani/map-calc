import { Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { SelectionService } from '../selection.service';

@Component({
  selector: 'app-feature-list-item',
  templateUrl: './feature-list-item.component.html',
  styleUrls: ['./feature-list-item.component.scss']
})
export class FeatureListItemComponent {
  @Input() feature:any;
  @ViewChild('menu') menu:FeatureListContextMenuComponent;

  menuVisibility=false;

  constructor(private selectionService:SelectionService){

  }

 get selection(){
  return this.selectionService.selection
 };


  selectFeature(feature,event){
    
    if(event.ctrlKey){
      this.selection.toggle(this.feature)
    }else{
      this.selection.clear()
      this.selection.select(feature)
    }

    this.selectionService.selectionChanged.next(this.selectionService.selection)
    // this.highlightFeature(this.selection.selected)
  }

  showPicker(e:PointerEvent){
    // let popups = document.getElementsByClassName("icon-list");

    // (popups as any).forEach((ele:HTMLDivElement)=>{
    //     ele.style.display='none'
    // })

    let menus =     document.querySelectorAll('.feature-list-item-menu');
    
    menus.forEach((ele : any)=>{
      console.log(ele)
        ele.style.setProperty('display',"none")
    });
    // this.alerts.forEach(ele=>console.log(ele));    
    // console.log(this.menu)
    // this.closeMenu()
    this.menuVisibility=true; 
    // document.addEventListener('click',(e)=>{
    //   const clickedInside = this.menu.nativeElement.contains(e.target as Node) || this.picker.nativeElement.contains(e.target as Node);
    //   if(!clickedInside){
    //   this.closePicker();
    //   }   
    // })
    this.repositionPickerDiv(e)
    this.selectionService.selectionChanged.next(this.selectionService.selection)

  }

  repositionPickerDiv(e:PointerEvent){
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

  
  onRightClick(e:any){
    e.stopPropagation();
    e.preventDefault();
    this.showPicker(e);
    this.repositionPickerDiv(e)
    // console.log(this.trigger)
    // if(this.trigger.menuOpen){
    //   this.trigger.closeMenu();
    // }
    // this.trigger.openMenu()
  }


  closeMenu(){
    // console.log(this.alerts)
    // console.log(this.alerts.length)
    // this.alerts.forEach(ele=>console.log(ele))
    this.menuVisibility=false; 

    // document.querySelectorAll('.feature-list-item-menu').forEach((ele : any)=>{
    //   console.log(ele)
    //   ele.style.setProperty('display',"none")
    // })

  }

}import { FeatureListContextMenuComponent } from '../feature-list-context-menu/feature-list-context-menu.component';

