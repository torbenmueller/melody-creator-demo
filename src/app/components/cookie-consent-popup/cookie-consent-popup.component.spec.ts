import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieConsentPopupComponent } from './cookie-consent-popup.component';

describe('CookieConsentPopupComponent', () => {
  let component: CookieConsentPopupComponent;
  let fixture: ComponentFixture<CookieConsentPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookieConsentPopupComponent],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true,
      rethrowApplicationErrors: false
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CookieConsentPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
