import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-checkout',
    imports: [],
    templateUrl: './checkout.component.html',
    styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  userIsAuthenticated: boolean = false;
  private authListenerSubs!: Subscription;
  plan: string | null = null;
  response: any = null;

  constructor(private authService: AuthService, private location: Location) {}

  ngOnInit(): void {
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
      });

    // Get plan and response from navigation state via Location
    const state = (this.location as any).getState();
    this.plan = state?.plan;
    this.response = state?.response;
  }

  openCheckout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.open('https://buy.stripe.com/8x27sN64g76Y0uy2yrfMA00', '_blank');
  }

  ngOnDestroy(): void {
    this.authListenerSubs?.unsubscribe();
  }
}
