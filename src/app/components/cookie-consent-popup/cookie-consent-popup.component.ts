import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, AfterViewInit, ViewChild, PLATFORM_ID, DOCUMENT } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-cookie-consent-popup',
    imports: [RouterLink],
    templateUrl: './cookie-consent-popup.component.html',
    styleUrl: './cookie-consent-popup.component.css'
})
export class CookieConsentPopupComponent implements AfterViewInit {
  @ViewChild('consentPopup') consentPopup!: ElementRef;

  private isBrowser: boolean;
  cookieStorage: any = {
    getItem: (key: any) => {
      if (!this.isBrowser) return null;
      try {
        const raw = this.document.cookie || '';
        if (!raw) return null;
        const pairs = raw.split(';').map(p => p.trim()).filter(p => p.length > 0);
        const cookies: Record<string, string> = {};
        for (const pair of pairs) {
          const idx = pair.indexOf('=');
          if (idx === -1) continue;
          const k = decodeURIComponent(pair.slice(0, idx).trim());
          const v = decodeURIComponent(pair.slice(idx + 1).trim());
          cookies[k] = v;
        }
        return cookies[key] ?? null;
      } catch (err) {
        console.warn('cookie getItem parse error', err);
        return null;
      }
    },
    setItem: (key: any, value: any, days = 365) => {
      if (!this.isBrowser) return;
      try {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        const cookie = `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}; expires=${expires}; path=/; SameSite=Lax`;
        this.document.cookie = cookie;
      } catch (err) {
        console.warn('cookie setItem error', err);
      }
    }
  }

  storageType: any = this.cookieStorage;
  consentPropertyName: string = 'mc_consent';

  constructor(@Inject(DOCUMENT) private document: Document, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    if (this.shouldShowPopup()) {
      setTimeout(() => {
        if (this.consentPopup && this.consentPopup.nativeElement) {
          this.consentPopup.nativeElement.classList.remove('hidden');
        }
      }, 2000);
    }
  }

  acceptFn() {
    this.saveToStorage();
    if (this.isBrowser && this.consentPopup && this.consentPopup.nativeElement) {
      this.consentPopup.nativeElement.classList.add('hidden');
    }
  }

  shouldShowPopup() {
    return !this.storageType.getItem(this.consentPropertyName);
  }

  saveToStorage() {
    this.storageType.setItem(this.consentPropertyName, true);
  }
}
