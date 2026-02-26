import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { FloatingNotesComponent } from '../floating-notes/floating-notes.component';

@Component({
    selector: 'app-header',
    imports: [FloatingNotesComponent],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID);

  scrollToPosition(y: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
