import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureListContextMenuComponent } from './feature-list-context-menu.component';

describe('FeatureListContextMenuComponent', () => {
  let component: FeatureListContextMenuComponent;
  let fixture: ComponentFixture<FeatureListContextMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeatureListContextMenuComponent]
    });
    fixture = TestBed.createComponent(FeatureListContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
