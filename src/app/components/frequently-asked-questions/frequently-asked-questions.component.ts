
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, DOCUMENT } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

@Component({
    selector: 'app-frequently-asked-questions',
    imports: [],
    templateUrl: './frequently-asked-questions.component.html',
    styleUrl: './frequently-asked-questions.component.css'
})
export class FrequentlyAskedQuestionsComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
