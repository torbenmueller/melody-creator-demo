import { Routes } from '@angular/router';
import { canActivate } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./components/settings/settings.component').then((m) => m.SettingsComponent)
	},
	{
		path: 'auth/login',
		loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent)
	},
	{
		path: 'auth/signup',
		loadComponent: () => import('./auth/signup/signup.component').then((m) => m.SignupComponent)
	},
	{
		path: 'auth/forgot-password',
		loadComponent: () => import('./auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
	},
	{
		path: 'auth/new-password/:token/:id',
		loadComponent: () => import('./auth/new-password/new-password.component').then((m) => m.NewPasswordComponent)
	},
	{
		path: 'auth/verify-email/:token/:id',
		loadComponent: () => import('./auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent)
	},
	{
		path: 'auth/verify-email-change/:token/:id',
		loadComponent: () => import('./auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent)
	},
	{
		path: 'auth/checkout',
		loadComponent: () => import('./auth/checkout/checkout.component').then((m) => m.CheckoutComponent)
	},
	{
		path: 'features',
		loadComponent: () => import('./components/features/features.component').then((m) => m.FeaturesComponent)
	},
	{
		path: 'pricing',
		loadComponent: () => import('./components/pricing/pricing.component').then((m) => m.PricingComponent)
	},
	{
		path: 'my-melodies',
		canActivate: [canActivate],
		loadComponent: () => import('./components/my-melodies/my-melodies.component').then((m) => m.MyMelodiesComponent)
	},
	{
		path: 'user-profile',
		canActivate: [canActivate],
		loadComponent: () => import('./components/user-profile/user-profile.component').then((m) => m.UserProfileComponent)
	},
	{
		path: 'privacy-policy',
		loadComponent: () => import('./components/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent)
	},
	{
		path: 'terms-and-conditions',
		loadComponent: () => import('./components/terms-and-conditions/terms-and-conditions.component').then((m) => m.TermsAndConditionsComponent)
	},
	{
		path: 'imprint',
		loadComponent: () => import('./components/imprint/imprint.component').then((m) => m.ImprintComponent)
	},
	{
		path: 'commercial-license-agreement',
		loadComponent: () => import('./components/commercial-license-agreement/commercial-license-agreement.component').then((m) => m.CommercialLicenseAgreementComponent)
	},
	{
		path: 'frequently-asked-questions',
		loadComponent: () => import('./components/frequently-asked-questions/frequently-asked-questions.component').then((m) => m.FrequentlyAskedQuestionsComponent)
	},
];
