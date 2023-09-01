import {Component, Inject, OnInit} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog';

@Component({
  selector: 'app-action-param-form',
  templateUrl: './action-param-form.component.html',
  styleUrls: ['./action-param-form.component.scss']
})
export class ActionParamFormComponent implements OnInit {

  form=this.fb.group({});

  constructor(
   @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ActionParamFormComponent>,public fb:FormBuilder
  ) {

    this.initForm(data.controls)

  }

  initForm(controls:string[]){
console.log(controls)
    controls.forEach(control=>{
      console.log(control)
      this.form.addControl(control,new FormControl(null));
    })
  }

  save(){
    this.dialogRef.close(this.form.value)
  }

  cancel(){
    this.dialogRef.close()
  }

  ngOnInit(){
console.log(this.data)
  }
}
