import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs';


export interface PeriodicElement {
  property: string;
  value: number;

}


@Component({
  selector: 'app-editable-table',
  templateUrl: './editable-table.component.html',
  styleUrls: ['./editable-table.component.scss']
})


export class EditableTableComponent implements OnInit,OnChanges {

  @Input() properties:any;
  @Output() propertiesChanged = new EventEmitter<any>();

  displayedColumns: string[] = ['property','value',"actions"];
  dataSource = new MatTableDataSource<any>();
 
 pageNumber: number = 1;
   VOForm: FormGroup;
   constructor(
     private fb: FormBuilder,
     private _formBuilder: FormBuilder){}
 
   ngOnInit(): void {
     this.VOForm = this._formBuilder.group({
       VORows: this._formBuilder.array([])
     });
 
      this.VOForm = this.fb.group({
               VORows: this.fb.array(Object.entries(this.properties).map((val:any) =>  this.fb.group({
                  property: new FormControl(val[0]),
                  value: new FormControl(val[1]),
  
                })
               
               )) //end of fb array
             }); // end of form group cretation

             this.dataSource = new MatTableDataSource((this.VOForm.get('VORows') as FormArray).controls);
 
     this.VOForm.valueChanges.pipe(  
      debounceTime(200),
     distinctUntilChanged()).subscribe(_=>{
      this.propertiesChanged.emit(this.VOForm.getRawValue())
     })
 
   }
 
 
 
   ngAfterViewInit() {
 
   }

   ngOnChanges(changes: SimpleChanges): void {

   let properties =  changes['properties']['currentValue'];

 if(this.VOForm && this.VOForm.controls){
  const control = this.VOForm.get('VORows') as FormArray;

  while(control.length!=0){
   control.removeAt(0)
  }

  Object.entries(properties).forEach(ele=>{
   control.push(this.fb.group({
   property: new FormControl({value:ele[0],disabled:ele[0]=='mapcalc_id'?true:false}),
   value: new FormControl({value:ele[1],disabled:ele[0]=='mapcalc_id'?true:false}),
   }));
  });

  this.dataSource = new MatTableDataSource(control.controls)
 }
  }
   
 
   AddNewRow() {
 
     const control = this.VOForm.get('VORows') as FormArray;
     control.insert(control.length,this.initiateVOForm());
     this.dataSource = new MatTableDataSource(control.controls)
 
   }
 
   // this function will enabled the select field for editd
   EditSVO(VOFormElement, i) {
 
     // VOFormElement.get('VORows').at(i).get('name').disabled(false)
     VOFormElement.get('VORows').at(i).get('isEditable').patchValue(false);
 
   }
 
   // On click of correct button in table (after click on edit) this method will call
   SaveVO(VOFormElement, i) {
     // alert('SaveVO')
     VOFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
   }
 
   // On click of cancel button in the table (after click on edit) this method will call and reset the previous data
   CancelSVO(VOFormElement, i) {
     VOFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
   }
 
 
deleteRow(i){
  (this.VOForm.get('VORows') as FormArray).removeAt(i);
    const control = this.VOForm.get('VORows') as FormArray;
  this.dataSource = new MatTableDataSource(control.controls)
}
 
 
 
   initiateVOForm(): FormGroup {
     return this.fb.group({
 
       property: new FormControl(""),
      value: new FormControl(''),
 
     });
   }
 
}
