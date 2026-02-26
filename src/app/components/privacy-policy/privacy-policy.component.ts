
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, DOCUMENT, PLATFORM_ID } from '@angular/core';

@Component({
    selector: 'app-privacy-policy',
    imports: [],
    templateUrl: './privacy-policy.component.html',
    styleUrl: './privacy-policy.component.css'
})
export class PrivacyPolicyComponent implements OnInit {
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
