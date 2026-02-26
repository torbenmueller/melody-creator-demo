import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
    selector: 'app-new-password',
    imports: [FormsModule],
    templateUrl: './new-password.component.html',
    styleUrl: './new-password.component.css'
})
export class NewPasswordComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
	passwordToken: string ='';
	userId: string ='';
  newPassword: string ='';
  showPassword: boolean = false;
  private authStatusSubscription!: Subscription;
  private routeSub!: Subscription;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.authStatusSubscription = this.authService.getAuthStatusListener().subscribe(authStatus => {
      this.isLoading = false;
    });
    this.routeSub = this.route.params.subscribe(params => {
      this.passwordToken = params['token'];
      this.userId = params['id'];
    });
  }

  ngOnDestroy(): void {
    this.authStatusSubscription?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  onSetNewPassword(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.authService.submitNewPassword(
      form.value.password,
      this.passwordToken,
	    this.userId
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
