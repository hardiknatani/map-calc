import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorDialogComponent } from './editor-dialog.component';

describe('EditorDialogComponent', () => {
  let component: EditorDialogComponent;
  let fixture: ComponentFixture<EditorDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditorDialogComponent]
    });
    fixture = TestBed.createComponent(EditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
