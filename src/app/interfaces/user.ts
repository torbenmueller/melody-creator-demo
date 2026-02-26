export interface User {
	email: string;
	userId: string;
	plan?: string; // 'free', 'pro', or 'enterprise'
	planValidUntil: Date;
	isEmailVerified?: boolean;
	creditsPermanent?: number;
	creditsDaily?: number;
	creditsDailyExpiresAt?: string | null;
	time?: Date;
	// allow other fields without losing typing for the known ones
	[key: string]: any;
}
