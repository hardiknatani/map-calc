import {Component, Inject, OnInit} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

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
    controls.forEach(control=>{
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
  }
}
