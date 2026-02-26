
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, DOCUMENT, PLATFORM_ID } from '@angular/core';

@Component({
    selector: 'app-terms-and-conditions',
    imports: [],
    templateUrl: './terms-and-conditions.component.html',
    styleUrl: './terms-and-conditions.component.css'
})
export class TermsAndConditionsComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.scrollToTop();
  }

  scrollToTop() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.body.scrollTop = 0;
    this.document.documentElement.scrollTop = 0;
  }
}
