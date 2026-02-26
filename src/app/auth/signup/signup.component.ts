import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-signup',
    imports: [FormsModule, RouterLink],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  showPassword: boolean = false;
  isAuthenticated: boolean = true;
  private authStatusSubscription!: Subscription;
  private currentPassword: string = '';
  public passwordStrengthPercent: number = 0;

  constructor(public authService: AuthService) {}

  public set password(value: string) {
    this.currentPassword = value;
    this.updatePasswordStrength(value);
  }

  public get password(): string {
    return this.currentPassword;
  }

  public get isEightCharachtersOrGreater(): boolean {
    return this.currentPassword.length >= 8;
  }

  public get hasOneCapitalLetterOrMore(): boolean {
    return /(.*[A-Z].*)/.test(this.currentPassword);
  }

  public get hasOneNumberOrMore(): boolean {
    return /(.*\d.*)/.test(this.currentPassword);
  }

  public get hasOneSpecialCharacterOrMore(): boolean {
    return /\W|_/g.test(this.currentPassword);
  }

  private updatePasswordStrength(value: string): void {
    let passwordStrength = 0;

    if (this.isEightCharachtersOrGreater) {
      passwordStrength += 25;
    }

    if (this.hasOneCapitalLetterOrMore) {
      passwordStrength += 25;
    }

    if (this.hasOneNumberOrMore) {
      passwordStrength += 25;
    }

    if (this.hasOneSpecialCharacterOrMore) {
      passwordStrength += 25;
    }

    this.passwordStrengthPercent = passwordStrength;
  }

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

  onSignup(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.authService.createUser(form.value.email, form.value.password);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
