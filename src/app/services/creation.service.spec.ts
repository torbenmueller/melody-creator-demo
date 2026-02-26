import { TestBed } from '@angular/core/testing';

import { CreationService } from './creation.service';

describe('CreationService', () => {
  let service: CreationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      errorOnUnknownElements: true,
      errorOnUnknownProperties: true,
      rethrowApplicationErrors: false
    });
    service = TestBed.inject(CreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
