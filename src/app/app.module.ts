import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material/material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BlockUIModule } from 'ng-block-ui';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { EditableTableComponent } from './editable-table/editable-table.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { ClickOutsideDirective } from './shared/clickOutside.directive';
import { SelectionService } from './selection.service';
import { FeatureListComponent } from './feature-list/feature-list.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { ActionParamFormComponent } from './action-param-form/action-param-form.component';
import { EditorDialogComponent } from './editor-dialog/editor-dialog.component';
@NgModule({
  declarations: [
    AppComponent,
    EditableTableComponent,ClickOutsideDirective, FeatureListComponent, ActionParamFormComponent, EditorDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
     ReactiveFormsModule
    ,BlockUIModule.forRoot(),
    CodemirrorModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' })

  ],
  providers: [SelectionService],
  bootstrap: [AppComponent]
})
export class AppModule { }
