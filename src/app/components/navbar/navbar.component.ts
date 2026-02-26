import { Component, Inject, OnDestroy, OnInit, DOCUMENT } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/auth.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatModalComponent } from '../mat-modal/mat-modal.component';
import { NgClass } from '@angular/common';
import { UserService } from '../../services/user.service';
import { StringUtilsService } from '../../services/string-utils.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive, MatDialogModule, MatButtonModule, NgClass],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  userIsAuthenticated: boolean = false;
  private authListenerSubs!: Subscription ;

  countdown: any;
  minutes: number = 0;
  seconds: number = 0;
  private expirationTimeMs: number = 0;
  userPlan: string = '';
  userCredits: number = 0;
  isUsingDailyCredits: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
    private stringUtils: StringUtilsService
  ) {}

  ngOnInit(): void {
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.initCountdown();
    // If we're already authenticated on init, fetch the user once
    if (this.userIsAuthenticated) {
      this.getUser();
    }

    this.authListenerSubs = this.authService.getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        // Only fetch user info when authenticated
        if (isAuthenticated) {
          this.getUser();
          setTimeout(() => this.initCountdown(), 50);
        } else {
          // Clear state on logout
          clearInterval(this.countdown);
          this.minutes = 0;
          this.seconds = 0;
          this.expirationTimeMs = 0;
          this.userPlan = '';
          this.userCredits = 0;
          this.isUsingDailyCredits = false;
        }
      });
    
    // Listen for credit updates and refresh credits when they change
    this.userService.creditUpdate$.subscribe(() => {
      if (this.userIsAuthenticated) {
        this.getUser();
      }
    });
  }

  private initCountdown(): void {
    const localStorage = this.document.defaultView?.localStorage;
    if (!localStorage) return;
    const expirationStr = localStorage.getItem('expiration');
    if (!expirationStr) return;
    const expirationTime = new Date(expirationStr).getTime();
    const remaining = expirationTime - Date.now();
    if (remaining <= 0) {
      this.minutes = 0;
      this.seconds = 0;
      return;
    }
    this.expirationTimeMs = expirationTime;
    if (this.countdown) clearInterval(this.countdown);
    this.startInterval();
  }

  getUser() {
    // Get both plan and credits from a single call
    this.userService.getCredits().subscribe({
      next: (credits) => {
        this.userPlan = this.stringUtils.capitalizeFirstLetter(credits.plan ?? '');
        
        // Check if permanent credits are exhausted for free users
        if ((credits.creditsPermanent || 0) === 0 && this.userPlan.toLowerCase() === 'free') {
          this.userCredits = credits.creditsDaily || 0;
          this.isUsingDailyCredits = true;
        } else {
          this.userCredits = credits.creditsPermanent || 0;
          this.isUsingDailyCredits = false;
        }
      },
      error: () => {
        this.userPlan = '';
        this.userCredits = 0;
        this.isUsingDailyCredits = false;
      }
    });
  }

  /**
   * Public method to refresh credit display
   * Can be called by other components after credit consumption
   */
  refreshCredits() {
    if (this.userIsAuthenticated) {
      this.getUser();
    }
  }

  ngOnDestroy(): void {
    this.authListenerSubs?.unsubscribe();
    clearInterval(this.countdown);
  }

  onLogout() {
    this.authService.logout();
    clearInterval(this.countdown);
    this.minutes = 0;
    this.seconds = 0;
    this.expirationTimeMs = 0;
  }

  private startInterval() {
    this.countdown = setInterval(() => {
      const remaining = this.expirationTimeMs - Date.now();
      this.minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      if (remaining <= 1000) {
        this.closeAllDialogs();
        clearInterval(this.countdown);
        this.minutes = 0;
        this.seconds = 0;
        this.openConfirmationDialog();
      }
    }, 1000);
  }

  closeAllDialogs(): void {
    this.dialog.closeAll();
  }

  openConfirmationDialog(): void {
    this.dialog.open(MatModalComponent, {
      width: '400px',
      data: {
        title: 'Automatically logged out',
        message:
          'For security reasons you were automatically logged out after 60 minutes.',
      },
    });
  }

  stayLoggedIn() {
    const newExpiration = new Date(new Date().getTime() + 60 * 60 * 1000);
    this.authService.updateAuthData(newExpiration);
    if (this.countdown) clearInterval(this.countdown);
    this.expirationTimeMs = newExpiration.getTime();
    this.startInterval();
  }
}
