import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { Settings } from '../../interfaces/settings';
import { Subscription } from 'rxjs';
import { CreationService } from '../../services/creation.service';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { ScoreComponent } from '../score/score.component';
import * as Tone from 'tone';
import { SettingComponent } from "../shared/setting/setting.component";
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { MatModalComponent } from '../mat-modal/mat-modal.component';

@Component({
    selector: 'app-settings',
    imports: [FormsModule, ScoreComponent, SettingComponent],
    templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly platformId = inject(PLATFORM_ID);
  allScales: string[] = [
    'Major',
    'Minor',
    'Pentatonic Major',
    'Pentatonic Minor',
    'Dorian',
    'Phrygian',
    'Lydian',
    'Mixolydian',
    'Locrian',
    'Chromatic',
    'Harmonic Minor',
    'Melodic Minor',
    'Whole Tone',
  ];
  restrictedScales: string[] = ['Major', 'Minor'];
  
  scales: string[] = this.allScales;
  
  keys: string[] = [
    'C',
    'Db',
    'D',
    'Eb',
    'E',
    'F',
    'F#',
    'Gb',
    'G',
    'Ab',
    'A',
    'Bb',
    'B',
  ];

  enharmonicKeys: { [key: string]: string } = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };

  private readonly MODES = new Set([
    'Minor',
    'Dorian',
    'Phrygian',
    'Lydian',
    'Mixolydian',
    'Locrian'
  ]);

  private readonly CROSS_KEYS = new Set([
    'G',
    'D',
    'A',
    'E',
    'B',
    'F#'
  ]);
  
  allBars: number[] = [2, 4, 8];
  restrictedBars: number[] = [2, 4];
  unauthorizedBars: number[] = [2];
  bars: number[] = this.allBars;
  
  allComplexity: string[] = ['Low', 'Medium', 'High'];
  restrictedComplexity: string[] = ['Low'];
  complexity: string[] = this.allComplexity;
  
  allBeats: string[] = ['4/4', '3/4'];
  restrictedBeats: string[] = ['4/4'];
  beats: string[] = this.allBeats;
  
  userPlan: string | null = null;
  hasRestrictions: boolean = false;

  settings!: Settings;
  melody!: any[];
  intervals!: any[];
  melodyDescription: string = '';

  isLoading: boolean = false;
  userIsAuthenticated: boolean = false;
  isPlaying: boolean = false;

  private authListenerSubs!: Subscription;
  private isPlayingSub?: Subscription;
  private readonly UNAUTHORIZED_MELODY_COUNT_KEY = 'unauthorizedMelodyCount';

  constructor(
    public creationService: CreationService,
    private authService: AuthService,
    private userService: UserService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        this.isLoading = false;
        if (!isAuthenticated) {
          this.melody = [];
          this.intervals = [];
          this.creationService.melodyCreatedWhileAuthenticated = false;
        }
        this.loadUserPlanAndApplyRestrictions();
        this.cdr.markForCheck();
      });
    this.isPlayingSub = this.creationService.isPlaying.subscribe((e) => {
      this.isPlaying = e;
      this.cdr.markForCheck();
    });
    this.settings = this.creationService.getSettings();
    this.melody = this.creationService.getMelody();
    if (this.settings === undefined) this.settings = this.initialSettings();
    this.melodyDescription = this.setDescription(this.settings);
    
    // Load user plan on init
    this.loadUserPlanAndApplyRestrictions();
  }
  
  private loadUserPlanAndApplyRestrictions(): void {
    // Only fetch plan if user is authenticated
    if (!this.userIsAuthenticated) {
      this.hasRestrictions = true;
      this.applyRestrictions();
      return;
    }
    
    this.userService.getUserPlan().subscribe({
      next: (response: { isAuthenticated: boolean; plan: string | null; hasRestrictions: boolean }) => {
        this.userPlan = response.plan;
        this.hasRestrictions = response.hasRestrictions;
        this.applyRestrictions();
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Failed to fetch user plan', error);
        // Default to restrictions if error
        this.hasRestrictions = true;
        this.applyRestrictions();
        this.cdr.markForCheck();
      }
    });
  }
  
  private applyRestrictions(): void {
    if (this.hasRestrictions) {
      // Apply restrictions for unauthenticated and free users
      this.scales = this.restrictedScales;
      // Unauthorized users: only 2 bars; Free users: 2 or 4 bars
      this.bars = this.userIsAuthenticated ? this.restrictedBars : this.unauthorizedBars;
      this.complexity = this.restrictedComplexity;
      this.beats = this.restrictedBeats;
      
      // Reset settings if current values are not allowed
      if (!this.restrictedScales.includes(this.settings.scale)) {
        this.settings.scale = this.restrictedScales[0];
      }
      const allowedBars = this.userIsAuthenticated ? this.restrictedBars : this.unauthorizedBars;
      if (!allowedBars.includes(this.settings.bar)) {
        this.settings.bar = allowedBars[0];
      }
      if (!this.restrictedComplexity.includes(this.settings.complex)) {
        this.settings.complex = this.restrictedComplexity[0];
      }
      if (!this.restrictedBeats.includes(this.settings.beat)) {
        this.settings.beat = this.restrictedBeats[0];
      }
    } else {
      // No restrictions - pro/enterprise users
      this.scales = this.allScales;
      this.bars = this.allBars;
      this.complexity = this.allComplexity;
      this.beats = this.allBeats;
    }
  }

  ngOnDestroy(): void {
    this.authListenerSubs?.unsubscribe();
    this.isPlayingSub?.unsubscribe();
  }

  onSubmit() {
    this.isLoading = true;
    
    // For unauthenticated users, proceed directly to generation
    if (!this.userIsAuthenticated) {
      this.createMelody();
      return;
    }

    // Check if user has enough credits before creating melody
    this.userService.checkCreditsAvailable(1).subscribe({
      next: (response: { hasEnoughCredits: boolean; plan?: string; creditsAvailable?: number; creditsRequired?: number; message?: string }) => {
        if (response.hasEnoughCredits) {
          // User has enough credits, proceed with melody creation
          // Credits will be consumed by backend after successful generation
          this.createMelody();
        } else {
          // Insufficient credits
          this.isLoading = false;
          this.toastr.error(`Cannot create melody: ${response.message || 'Insufficient credits'}`);
        }
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Failed to check credits', error);
        this.toastr.error('Error checking credits. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  private createMelody() {
    this.creationService.submitSettings(this.settings, this.userIsAuthenticated).subscribe({
      next: (result) => {
        this.melody = result.melody;
        this.intervals = result.intervals;
        this.isLoading = false;
        this.melodyDescription = this.setDescription(result.settings);
        
        // Refresh user data to update credits display and plan (if authenticated)
        // This ensures we have the latest plan info in case it was downgraded during generation
        if (this.userIsAuthenticated) {
          this.userService.refreshUser();
          this.loadUserPlanAndApplyRestrictions();
        } else {
          // Track unauthorized melody creation and show registration prompt after 3
          this.trackUnauthorizedMelodyCreation();
        }
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Failed to generate melody', error);
        // Show backend validation errors if present
        if (error.error?.errors) {
          this.toastr.error(error.error.errors.join(', '));
        } else if (error.error?.message) {
          this.toastr.error(error.error.message);
        } else {
          this.toastr.error('Error generating melody. Please try again.');
        }
        this.cdr.markForCheck();
      }
    });
  }

  async play(): Promise<void> {
    await Tone.start();
    this.creationService.playMelody();
  }

	save() {
		// If melody was created while authenticated, credits were already consumed during creation
		if (this.creationService.melodyCreatedWhileAuthenticated) {
			// Save without consuming additional credits
			this.creationService.save(false).subscribe({
				next: (response) => {
					this.toastr.success(response.message);
					// Reset melody after saving to prevent double saves
					this.melody = [];
					this.intervals = [];
					this.creationService.resetMelody();
				},
				error: (error) => {
					if (error.status === 403) {
						const errorMsg = error.error.errors?.join(', ') || error.error.message || 'Cannot save melody with current settings';
						this.toastr.error(errorMsg);
					} else {
						this.toastr.error('Failed to save melody. Please try again.');
					}
				}
			});
			return;
		}

		// Melody was created before authentication - show confirmation modal
		const dialogRef = this.dialog.open(MatModalComponent, {
			data: {
				title: 'Save Melody',
				message: 'This melody was created before you logged in. You can save it for 1 credit.'
			}
		});

		dialogRef.afterClosed().subscribe((confirmed: boolean) => {
			if (!confirmed) {
				return; // User cancelled
			}

			// User confirmed - check and consume credits
			this.userService.checkCreditsAvailable(1).subscribe({
				next: (response: { hasEnoughCredits: boolean; plan?: string; creditsAvailable?: number; creditsRequired?: number; message?: string }) => {
					if (response.hasEnoughCredits) {
						// User has enough credits, proceed with save and consume credit
						this.creationService.save(true).subscribe({
						next: (saveResponse) => {
						this.toastr.success(saveResponse.message);
						// Refresh user data to update credits display
						this.userService.refreshUser();
						// Reset melody after saving to prevent double saves
						this.melody = [];
						this.intervals = [];
						this.creationService.resetMelody();
						},
							error: (error) => {
								if (error.status === 403) {
									const errorMsg = error.error.errors?.join(', ') || error.error.message || 'Cannot save melody with current settings';
									this.toastr.error(errorMsg);
								} else {
									this.toastr.error('Failed to save melody. Please try again.');
								}
							}
						});
					} else {
						// Insufficient credits
						this.toastr.error(`Cannot save melody: ${response.message || 'Insufficient credits'}`);
					}
				},
				error: (error: any) => {
					console.error('Failed to check credits for save', error);
					this.toastr.error('Error checking credits. Please try again.');
				}
			});
		});
	}

  initialSettings(): Settings {
    const initlialSetting = {
      scale: this.scales[0],
      key: this.keys[0],
      bar: this.bars[0],
      complex: this.complexity[0],
      beat: this.beats[0],
      name: 'Melody',
      rootKey: this.keys[0],
    };
    return initlialSetting;
  }

  setDescription(settings: Settings): string {
    const complex = settings.complex.toLowerCase();
    const key = this.checkForEnharmonicConfusion(settings);
    const description = `Your melody is in ${key} ${settings.scale}, has ${settings.bar} bars, ${complex} complexity and a
		${settings.beat} beat.`;
    return description;
  }

  checkForEnharmonicConfusion(settings: Settings): string {
    if (this.isMode(settings.scale)) {
      const hasFlat = settings.key.includes('b') || settings.key === 'F';
      const hasCrossKey = this.isCrossKey(settings.rootKey);
      
      if (hasFlat && hasCrossKey) {
        const enharmonic = this.enharmonicKeys[settings.key];
        return enharmonic ? `${enharmonic} (enharm. ${settings.key})` : settings.key;
      }
    }
    return settings.key;
  }

  isMode(scale: string): boolean {
    return this.MODES.has(scale);
  }

  isCrossKey(rootKey: string): boolean {
    return this.CROSS_KEYS.has(rootKey);
  }

  onScaleChange(scale: string): void {
    this.settings.scale = scale;
  }

  onKeyChange(key: string): void {
    this.settings.key = key;
  }

  onBarChange(bar: string): void {
    this.settings.bar = Number(bar);
  }

  onComplexityChange(complex: string): void {
    this.settings.complex = complex;
  }

  onBeatChange(beat: string): void {
    this.settings.beat = beat;
  }

  resetSettings(): void {
    this.settings = this.initialSettings();
    this.melodyDescription = this.setDescription(this.settings);
  }

  private trackUnauthorizedMelodyCreation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const currentCount = parseInt(localStorage.getItem(this.UNAUTHORIZED_MELODY_COUNT_KEY) || '0');
      const newCount = currentCount + 1;
      localStorage.setItem(this.UNAUTHORIZED_MELODY_COUNT_KEY, newCount.toString());
      
      // Show registration prompt after 3 melodies
      if (newCount >= 3) {
        this.showRegistrationPrompt();
      }
    } catch (error) {
      console.error('Failed to track unauthorized melody creation', error);
    }
  }

  private showRegistrationPrompt(): void {
    const dialogRef = this.dialog.open(MatModalComponent, {
      data: {
        title: 'Unlock More Features!',
        message: 'register-prompt'
      }
    });
  }
}
