
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, DOCUMENT, PLATFORM_ID } from '@angular/core';

@Component({
    selector: 'app-imprint',
    imports: [],
    templateUrl: './imprint.component.html',
    styleUrl: './imprint.component.css'
})
export class ImprintComponent implements OnInit {
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
