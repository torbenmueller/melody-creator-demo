import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter, tap } from 'rxjs/operators';
import { MatModalComponent } from '../mat-modal/mat-modal.component';
import { UserService } from '../../services/user.service';
import { CreationService } from '../../services/creation.service';
import { AuthService } from '../../auth/auth.service';
import { StringUtilsService } from '../../services/string-utils.service';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../interfaces/user';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-user-profile',
    imports: [CommonModule, FormsModule, DatePipe, RouterLink],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private userSub!: Subscription;
  private modesSub!: Subscription;
  private melodiesSub!: Subscription;
  private emailCheckSub?: Subscription;
  private emailInput$ = new Subject<string>();

  user: any;
  modes: any = [];
  numberOfModes: number = 0;
  modesMaxValue: number = 0;
  melodies: any = [];
  totalMelodies: number = 0;
  isLoading: boolean = false;
  currentEmail: string = '';
  newEmail: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  showPassword: boolean = false;
  showNewPassword: boolean = false;
  latestMelodies: any = [];
  // email availability UI
  checkingEmail: boolean = false;
  emailAvailable: boolean | null = null; // null = unknown, true = available, false = taken
  emailAvailabilityMessage: string = '';
  passwordChangeRequestsLimitReached: boolean = false;
  userPlan: string = '';

  isDateInFuture(date: Date | string): boolean {
    if (!date) return false;
    return new Date(date) > new Date();
  }

  openPurchaseCreditsModal(): void {
    const dialogRef = this.dialog.open(MatModalComponent, {
      width: '800px',
      data: {
        title: 'Purchase Additional Credits',
        isPurchaseCreditsModal: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.purchased) {
        // Handle successful purchase
        console.log('Credits purchased:', result.amount);
        // Refresh user data to show updated credits
        this.loadUserData();
      }
    });
  }

  constructor(
    private userService: UserService,
    public creationService: CreationService,
    public authService: AuthService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private stringUtils: StringUtilsService
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    // Debounced email availability check
    this.emailCheckSub = this.emailInput$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter((email) => !!email && email.trim().length > 3),
        tap(() => {
          this.checkingEmail = true;
          this.emailAvailable = null;
          this.emailAvailabilityMessage = '';
        }),
        switchMap((email) => this.userService.checkEmail(email).pipe(
          catchError(err => {
            // Map errors to a consistent response object
            const msg = (err?.status === 429) ? 'Rate limit reached, try again later.' : 'Could not verify availability.';
            return of({ available: false, message: msg });
          })
        ))
      )
      .subscribe((res: { available: boolean; message?: string }) => {
        this.checkingEmail = false;
        this.emailAvailable = !!res.available;
        this.emailAvailabilityMessage = res.message || (this.emailAvailable ? 'Email available' : 'Email already in use');
      });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.modesSub?.unsubscribe();
    this.melodiesSub?.unsubscribe();
    this.emailCheckSub?.unsubscribe();
  }

  loadUserData(): void {
    this.getUser();
    this.getMelodies();
    this.getModes();
  }

  getUser() {
    // Subscribe to user updates
    this.userSub = this.userService.user$.subscribe((u: User | null) => {
      if (u) {
        this.user = u;
        this.currentEmail = u.email;
        this.newEmail = u.email;
        this.userPlan = this.stringUtils.capitalizeFirstLetter(u.plan ?? '');
      }
    });

    // Request user from backend if not cached
    if (!this.userService.getCurrentUser()) {
      this.userService.getUser().subscribe();
    }
  }

  getMelodies() {
    this.isLoading = true;
    this.creationService.getMelodies(10, 1, 'time', -1);
    this.melodiesSub = this.creationService
      .getMelodiesUpdateListener()
      .subscribe((data: { melodies: any; melodiesCount: number }) => {
        this.melodies = data.melodies;
        this.totalMelodies = data.melodiesCount;
        this.latestMelodies = this.melodies.slice(0, 3);
        this.isLoading = false;
      });
  }

  getModes() {
    this.userService.getModes();
    this.modesSub = this.userService
      .getModesUpdateListener()
      .subscribe((data: { message: string; modes: any }) => {
        this.modes = Object.entries(data.modes.modeValues).sort((a: [string, any], b: [string, any]) => {
          const av = typeof a[1] === 'number' ? a[1] : Number(a[1]);
          const bv = typeof b[1] === 'number' ? b[1] : Number(b[1]);
          return bv - av;
        });
        this.numberOfModes = Object.keys(this.modes).length;
        this.modesMaxValue = data.modes.maxValue;
      });
  }

  openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(MatModalComponent, {
      width: '400px',
      data: {
        title: 'Confirm Deletion',
        message: 'Do you really want to delete your account?',
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.deleteAccount();
      }
    });
  }

  deleteAccount() {
    this.authService.deleteUser();
  }

  isStringEmpty(str: string) {
    return str.trim().length === 0;
  }

  onSubmitNewEmail(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    if (this.newEmail === this.currentEmail) {
      this.toastr.info('Email is the same as the current one.');
      return;
    }
    // First check whether the email is already used by another account
    this.userService.checkEmail(form.value.email).subscribe({
      next: (res: {available: boolean, message?: string}) => {
        if (res.available) {
          this.authService.updateEmail(form.value.email);
        } else {
          this.toastr.error(res.message || 'Email is already in use.');
        }
      },
      error: (err) => {
        if (err?.status === 409) {
          this.toastr.error('Email is already in use.');
        } else {
          this.toastr.error('Could not verify email availability. Please try again later.');
        }
      }
    });
  }

  onEmailInput(value: string) {
    // Reset availability if same as current
    if (!value || value.trim() === '' || value === this.currentEmail) {
      this.checkingEmail = false;
      this.emailAvailable = null;
      this.emailAvailabilityMessage = '';
      return;
    }
    this.emailInput$.next(value);
  }

  onSubmitNewPassword(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.passwordChangeRequestsLimitReached = false;
    this.authService.updatePassword(form.value.password, form.value.newpassword).subscribe({
      next: () => {
        this.toastr.success('Password successfully changed');
      },
      error: (err) => {
        if (err && (err.status === 429)) {
          this.passwordChangeRequestsLimitReached = true;
        }
        this.toastr.error(err.error.message);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }
}
