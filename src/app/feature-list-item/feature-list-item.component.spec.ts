import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureListItemComponent } from './feature-list-item.component';

describe('FeatureListItemComponent', () => {
  let component: FeatureListItemComponent;
  let fixture: ComponentFixture<FeatureListItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeatureListItemComponent]
    });
    fixture = TestBed.createComponent(FeatureListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
