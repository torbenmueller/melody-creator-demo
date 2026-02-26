import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-verify-email',
    imports: [],
    templateUrl: './verify-email.component.html',
    styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  statusMessage = 'Verifying your email...';
  token: string | null = null;
  userId: string | null = null;
  isVerifying = false;
  statusHtml: SafeHtml | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    this.userId = this.route.snapshot.paramMap.get('id');
    if (!this.token || !this.userId) {
      this.statusMessage = 'Invalid verification link.';
      return;
    }
    this.statusMessage = 'Click Confirm to verify your email.';
  }

  confirmVerification() {
    if (!this.token || !this.userId) return;
    this.isVerifying = true;
    // Decide which backend endpoint to call depending on the route path
    const routePath = this.route.snapshot.routeConfig?.path || '';
    const isChange = routePath.includes('verify-email-change');

    const obs = isChange
      ? this.authService.verifyEmailChange(this.token, this.userId)
      : this.authService.verifyEmail(this.token, this.userId);

    obs.subscribe({
      next: () => {
        this.isVerifying = false;
        const html = 'Email verified successfully. You can now <a href="/auth/login" class="link">log in</a>.';
        this.statusHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.statusMessage = '';
        this.toastr.success('Your email has been verified. You can now log in.');
      },
      error: (error) => {
        this.isVerifying = false;
        let message = 'Email verification failed.';
        if (error?.status === 400) {
          message = 'Invalid or expired verification link.';
        } else if (error?.status >= 500) {
          message = 'Server error during verification. Please try again later.';
        }
        this.statusMessage = message;
        this.toastr.error(message);
      }
    });
  }
}
