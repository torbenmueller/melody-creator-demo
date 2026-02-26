import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    imports: [FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  user: any;
  isLoading: boolean = false;
  showPassword: boolean = false;
  isAuthenticated: boolean = true;
  emailIsConfirmed: boolean = true;
  private authStatusSubscription!: Subscription;
  resendLoading: boolean = false;

  constructor(
    public authService: AuthService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.authStatusSubscription = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isLoading = false;
        this.isAuthenticated = authStatus;
      });
  }

  ngOnDestroy(): void {
    this.authStatusSubscription?.unsubscribe();
  }

  onLogin(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.authService.loginUser(form.value.email, form.value.password).subscribe({
      next: () => {
        console.log('Login successful');
      },
      error: (err) => {
        this.toastr.error('Login failed: ' + err.error.message);
        if (err?.status === 403 && err.error?.message && err.error.message.toLowerCase().includes('verify')) {
          this.emailIsConfirmed = false;
        }
      }
    });
  }

  onResendActivation(email?: string) {
    const targetEmail = (email && email.toString().trim()) || '';
    if (!targetEmail) {
      this.toastr.error('Please enter the email address for your account to resend activation.');
      return;
    }
    this.resendLoading = true;
    this.authService.resendActivation(targetEmail).subscribe({
      next: (res: {message: string}) => {
        this.resendLoading = false;
        this.toastr.success(res.message || 'Verification email resent. Please check your inbox.');
      },
      error: (err) => {
        this.resendLoading = false;
        const msg = err?.error?.message || 'Failed to resend activation email. Please try again later.';
        this.toastr.error(msg);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
