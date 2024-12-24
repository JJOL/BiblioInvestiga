import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsPanelComponent } from './comments-panel.component';

describe('CommentsPanelComponent', () => {
  let component: CommentsPanelComponent;
  let fixture: ComponentFixture<CommentsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentsPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
