import { Injectable, OnDestroy } from '@angular/core';
import * as Tone from 'tone';
import { Settings } from '../interfaces/settings';
import { 
	MelodyNote, 
	Scale, 
	MelodyData, 
	GenerateMelodyResponse, 
	FetchedMelody, 
	MelodiesResponse 
} from '../interfaces/melody-model';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + "/melodies";
const DURATION_PRECISION_MULTIPLIER = 10;
const COUNTDOWN_INTERVAL_MS = 1000;

@Injectable({
  providedIn: 'root'
})
export class CreationService implements OnDestroy {
	settings!: Settings;
	scale!: Scale;
	melody!: MelodyNote[];
	intervalCheck: number[] = [];
	sampler!: Tone.Sampler;
	melodyCreatedWhileAuthenticated: boolean = false;

	// Initialize sampler using singleton pattern - only creates if not already exists
	initSampler() {
		if (!this.sampler) {
			this.sampler = new Tone.Sampler({
				urls: {
					"C4": "piano_c4.mp3"
				},
				release: 1,
				baseUrl: "../../assets/samples/",
			}).toDestination();
		}
	}

	private melodiesUpdated = new Subject<{melodies: FetchedMelody[], melodiesCount: number}>();
	private countdownInterval: NodeJS.Timeout | null = null;

	fetchedMelodies: FetchedMelody[] = [];
	maxMelodies: number = 0;

	isPlaying = new Subject<boolean>();
	scoreData = new Subject<MelodyData>();

	constructor(
		private http: HttpClient
	) { }

	addMelody(melody: MelodyNote[], consumeCredit: boolean = false): Observable<{message: string}> {
		const post = {
			melody: melody,
			settings: this.settings,
			consumeCredit: consumeCredit
		}
		return this.http.post<{message: string}>(BACKEND_URL, post);
	}

	getMelodies(melodiesPerPage: number, currentPage: number, sortByType: string, order: number): Observable<MelodiesResponse> {
		const queryParams = `?pagesize=${melodiesPerPage}&page=${currentPage}&sort_by_type=${sortByType}&order=${order}`;
		return this.http.get<MelodiesResponse>(BACKEND_URL + queryParams).pipe(
			tap((data) => {
				this.fetchedMelodies = data.melodies;
				this.maxMelodies = data.maxMelodies;
				this.melodiesUpdated.next({ melodies: this.fetchedMelodies, melodiesCount: this.maxMelodies });
			}),
			catchError((error) => {
				console.error('Error fetching melodies:', error);
				this.melodiesUpdated.next({ melodies: [], melodiesCount: 0 });
				return throwError(() => error);
			})
		);
	}

	getMidiFile(id: string): Observable<HttpResponse<ArrayBuffer>> {
		const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
		return this.http.get(`${BACKEND_URL}/midi/${id}`, {
			headers: headers,
			responseType: 'arraybuffer',
			observe: 'response'
		});
	}

	deleteMelody(id: string) {
		return this.http.delete(`${BACKEND_URL}/${id}`);
	}

	updateMelodyName(id: string, name: string): Observable<{message: string}> {
		return this.http.patch<{message: string}>(`${BACKEND_URL}/${id}`, { name });
	}

	getMelodiesUpdateListener() {
		return this.melodiesUpdated.asObservable();
	}

	// INITIAL CALL FROM COMPONENT - Now calls backend for generation
	submitSettings(settings: Settings, isAuthenticated: boolean): Observable<GenerateMelodyResponse> {
		// Call backend to generate melody (backend handles authentication detection)
		return this.http.post<GenerateMelodyResponse>(BACKEND_URL + '/generate', { settings }).pipe(
			tap((result: GenerateMelodyResponse) => {
				// Store the generated melody and related data
				this.melody = result.melody;
				this.scale = result.scale;
				this.settings = result.settings;
				this.intervalCheck = result.intervals;
				this.melodyCreatedWhileAuthenticated = isAuthenticated;
				
				// Notify components of new melody
				this.getScoreData();
			})
		);
	}

	getMelody() {
		return this.melody;
	}

	getSettings() {
		return this.settings;
	}

	setMelody(melodyData: MelodyData) {
		this.melody = melodyData.melody;
		this.settings = melodyData.settings;
		this.scale = melodyData.scale;
		this.getScoreData();
	}

	getScoreData() {
		this.scoreData.next({
			melody: this.melody,
			settings: this.settings,
			scale: this.scale
		});
	}

	playMelody() {
		try {
			this.initSampler();
			const now = Tone.now();
			let duration = 0;

			Tone.loaded()
				.then(() => {
					this.melody.forEach((tone, index) => {
						this.sampler.triggerAttackRelease(this.melody[index].note, this.melody[index].time, now + duration);
						duration += Tone.Time(this.melody[index].time).toSeconds();
						this.isPlaying.next(true);
					});

				let timeLeft = Math.round(duration * DURATION_PRECISION_MULTIPLIER) / DURATION_PRECISION_MULTIPLIER;
				this.countdownInterval = setInterval(() => {
					if (timeLeft <= 0) {
						if (this.countdownInterval) {
							clearInterval(this.countdownInterval);
							this.countdownInterval = null;
						}
						this.isPlaying.next(false);
					}
					timeLeft -= 1;
				}, COUNTDOWN_INTERVAL_MS);
				})
				.catch((error) => {
					console.error('Error loading audio samples:', error);
					this.isPlaying.next(false);
				});
		} catch (error) {
			console.error('Error in playMelody:', error);
			this.isPlaying.next(false);
		}
	}

	stop() {
		try {
			if (this.countdownInterval) {
				clearInterval(this.countdownInterval);
				this.countdownInterval = null;
			}
			
			if (this.sampler) {
				this.sampler.releaseAll();
			}
			
			this.isPlaying.next(false);
		} catch (error) {
			console.error('Error stopping playback:', error);
			this.isPlaying.next(false);
		}
	}

	save(consumeCredit: boolean = false): Observable<{message: string}> {
		return this.addMelody(this.melody, consumeCredit);
	}

	play(melody: MelodyNote[]) {
		this.melody = melody;
		this.playMelody();
	}

	resetMelody() {
		this.melody = [];
		this.scale = { notes: [] };
		this.intervalCheck = [];
		this.melodyCreatedWhileAuthenticated = false;
	}

	// Handle authentication state changes - should be called when user logs out to prevent stale authentication flag
	onAuthStateChange(isAuthenticated: boolean): void {
		if (!isAuthenticated && this.melodyCreatedWhileAuthenticated) {
			// User logged out, reset the flag to prevent unauthorized saves
			this.melodyCreatedWhileAuthenticated = false;
		}
	}

	ngOnDestroy(): void {
		try {
			// Complete all Subjects
			this.melodiesUpdated.complete();
			this.isPlaying.complete();
			this.scoreData.complete();

			// Clear any running intervals
			if (this.countdownInterval) {
				clearInterval(this.countdownInterval);
				this.countdownInterval = null;
			}

			// Dispose of audio resources
			if (this.sampler) {
				this.sampler.releaseAll();
				this.sampler.dispose();
			}
		} catch (error) {
			console.error('Error during cleanup:', error);
		}
	}
}
