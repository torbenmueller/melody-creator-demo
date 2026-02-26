import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommercialLicenseAgreementComponent } from './commercial-license-agreement.component';

describe('CommercialLicenseAgreementComponent', () => {
  let component: CommercialLicenseAgreementComponent;
  let fixture: ComponentFixture<CommercialLicenseAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommercialLicenseAgreementComponent],
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true,
      rethrowApplicationErrors: false
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommercialLicenseAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
