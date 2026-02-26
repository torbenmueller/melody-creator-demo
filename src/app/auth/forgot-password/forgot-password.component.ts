import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-forgot-password',
    imports: [FormsModule, RouterLink],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  limitReached: boolean = false;
  private authStatusSubscription!: Subscription;

  constructor(
    public authService: AuthService,
    private toastr: ToastrService,
  ) { }

  ngOnInit(): void {
    this.authStatusSubscription = this.authService.getAuthStatusListener().subscribe(authStatus => {
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.authStatusSubscription?.unsubscribe();
  }

  onResetPassword(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.limitReached = false;
    this.authService.resetPassword(form.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Password reset email sent');
      },
      error: (err) => {
        this.isLoading = false;
        if (err && (err.status === 429)) {
          this.limitReached = true;
        }
        this.toastr.error('Password reset failed: ' + err.error.message);
      }
    });
  }
}
