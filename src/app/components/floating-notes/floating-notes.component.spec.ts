import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingNotesComponent } from './floating-notes.component';

describe('FloatingNotesComponent', () => {
  let component: FloatingNotesComponent;
  let fixture: ComponentFixture<FloatingNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
