import { Settings } from './settings';

export interface MelodyNote {
	note: string;
	time: string;
}

export interface Scale {
	notes: string[];
	intervals?: number[];
}

export interface MelodyData {
	melody: MelodyNote[];
	settings: Settings;
	scale: Scale;
}

export interface GenerateMelodyResponse {
	melody: MelodyNote[];
	scale: Scale;
	settings: Settings;
	intervals: number[];
}

export interface FetchedMelody {
	_id: string;
	melody: MelodyNote[];
	settings: Settings;
	scale: Scale;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface MelodiesResponse {
	message: string;
	melodies: FetchedMelody[];
	maxMelodies: number;
}

// Legacy interface - consider removing if not used elsewhere
export interface MelodyModel {
	// id: string;
	melody: [
		{
			note: string;
			time: string;
		}
	];
}
