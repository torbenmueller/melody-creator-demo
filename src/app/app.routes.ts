import { Routes } from '@angular/router';
import { ImprintComponent } from './components/imprint/imprint.component';
import { FeaturesComponent } from './components/features/features.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { canActivate } from './auth/auth.guard';
import { MyMelodiesComponent } from './components/my-melodies/my-melodies.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NewPasswordComponent } from './auth/new-password/new-password.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { CheckoutComponent } from './auth/checkout/checkout.component';
import { CommercialLicenseAgreementComponent } from './components/commercial-license-agreement/commercial-license-agreement.component';
import { FrequentlyAskedQuestionsComponent } from './components/frequently-asked-questions/frequently-asked-questions.component';

export const routes: Routes = [
	{ path: '', component: SettingsComponent },
	{ path: 'auth/login', component: LoginComponent },
	{ path: 'auth/signup', component: SignupComponent },
	{ path: 'auth/forgot-password', component: ForgotPasswordComponent },
	{ path: 'auth/new-password/:token/:id', component: NewPasswordComponent },
	{ path: 'auth/verify-email/:token/:id', component: VerifyEmailComponent },
	{ path: 'auth/verify-email-change/:token/:id', component: VerifyEmailComponent },
	{ path: 'auth/checkout', component: CheckoutComponent },
	{ path: 'features', component: FeaturesComponent },
	{ path: 'pricing', component: PricingComponent },
	{ path: 'my-melodies', component: MyMelodiesComponent, canActivate: [canActivate] },
	{ path: 'user-profile', component: UserProfileComponent, canActivate: [canActivate] },
	{ path: 'privacy-policy', component: PrivacyPolicyComponent},
	{ path: 'terms-and-conditions', component: TermsAndConditionsComponent},
	{ path: 'imprint', component: ImprintComponent},
	{ path: 'commercial-license-agreement', component: CommercialLicenseAgreementComponent},
	{ path: 'frequently-asked-questions', component: FrequentlyAskedQuestionsComponent},
];
