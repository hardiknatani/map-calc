import { Component, ViewChild,Input,Inject, OnInit, Injector } from '@angular/core';
import { validate } from '../geojsonHelpers';
import { Editor } from 'codemirror';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-editor-dialog',
  templateUrl: './editor-dialog.component.html',
  styleUrls: ['./editor-dialog.component.scss']
})
export class EditorDialogComponent implements OnInit {
  hasError:boolean=false
  @ViewChild('codeMirror', { static: true }) editor!: Editor;
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

  constructor(   private dialogRef: MatDialogRef<EditorDialogComponent>,@Inject(MAT_DIALOG_DATA) public data: any){

  }

  ngOnInit(): void {
  }
  codeMirrorLoaded() {
    this.editor = (this.editor as any).codeMirror;
    this.editor.setSize("50vw", "75vh");
    this.editor.setValue(this.data)

  }

  handleChange(e) {
    if (!e.length) return;
    let value = e;
    validate(value, this.editor);

    setTimeout(()=>{
    let errors = document.getElementsByClassName('error-marker');
    this.hasError=false;
    if(errors.length>0){
      this.hasError=true
    }
    },100)

}


closeDialog(){
  this.dialogRef.close(this.editor.getValue())
}

}
