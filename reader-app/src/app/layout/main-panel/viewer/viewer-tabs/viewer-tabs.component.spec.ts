import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewerTabsComponent } from './viewer-tabs.component';

describe('ViewerTabsComponent', () => {
  let component: ViewerTabsComponent;
  let fixture: ComponentFixture<ViewerTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewerTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewerTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
