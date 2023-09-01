import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionParamFormComponent } from './action-param-form.component';

describe('ActionParamFormComponent', () => {
  let component: ActionParamFormComponent;
  let fixture: ComponentFixture<ActionParamFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActionParamFormComponent]
    });
    fixture = TestBed.createComponent(ActionParamFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
