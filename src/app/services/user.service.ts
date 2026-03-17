import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, finalize, shareReplay } from 'rxjs/operators';
import { User } from '../interfaces/user';

const BACKEND_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // BehaviorSubject holds the latest user value so late subscribers get the current user
  private user = new BehaviorSubject<User | null>(null);
  public readonly user$ = this.user.asObservable();
  private inFlightRequest: Observable<User> | null = null;
  
  // Subject for broadcasting credit updates
  private creditUpdateSubject = new Subject<void>();
  public readonly creditUpdate$ = this.creditUpdateSubject.asObservable();

  constructor(
    private http: HttpClient
  ) { }

  // Fetch user from backend. Returns an observable that emits the user.
  // Uses an in-flight guard to avoid duplicate concurrent requests and
  // updates the internal BehaviorSubject when the HTTP call succeeds.
  getUser(forceReload = false): Observable<User> {
    const cached = this.getCurrentUser();
    if (cached && !forceReload) {
      return of(cached);
    }

    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }

    this.inFlightRequest = this.http.get<User>(BACKEND_URL + "/user/get-user")
      .pipe(
        tap((data) => this.user.next(data)),
        finalize(() => { this.inFlightRequest = null; }),
        // ensure late subscribers get the same result without re-running
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.inFlightRequest;
  }

  // Return the current cached user value (or null if none).
  getCurrentUser() {
    return this.user.getValue();
  }

  getUserUpdateListener() {
    return this.user.asObservable();
  }

  getModes(): Observable<{ message: string; modes: any }> {
    return this.http.get<{ message: string; modes: any }>(BACKEND_URL + '/melodies/modes');
  }

  checkEmail(email: string) {
    return this.http.get<{available: boolean, message?: string}>(BACKEND_URL + "/user/check-email?email=" + encodeURIComponent(email));
  }

  
  // Fetches the user's plan information to determine feature restrictions.
  // Returns whether the user is authenticated and if they have restrictions (free or unauthenticated).
  getUserPlan(): Observable<{ isAuthenticated: boolean; plan: string | null; hasRestrictions: boolean }> {
    return this.http.get<{ isAuthenticated: boolean; plan: string | null; hasRestrictions: boolean }>(
      `${BACKEND_URL}/user/user-plan`
    );
  }

  // Fetches the user's current credit balances from the backend.
  // Returns an observable that emits the credit details.
  getCredits(): Observable<{ plan?: string; creditsPermanent: number; creditsDaily: number; creditsDailyExpiresAt: string | null }> {
    return this.http.get<{ plan?: string; creditsPermanent: number; creditsDaily: number; creditsDailyExpiresAt: string | null }>(
      `${BACKEND_URL}/user/credits`
    );
  }

  // Checks if the user has enough credits available to create a melody.
  // Returns an observable that emits the credit availability details.
  checkCreditsAvailable(amount: number): Observable<{ 
    hasEnoughCredits: boolean; 
    plan?: string; 
    creditsAvailable?: number; 
    creditsRequired?: number; 
    message?: string 
  }> {
    return this.http.post<{ 
      hasEnoughCredits: boolean; 
      plan?: string; 
      creditsAvailable?: number; 
      creditsRequired?: number; 
      message?: string 
    }>(
      `${BACKEND_URL}/user/credits/check`,
      { amount }
    );
  }

  // Triggers a refresh of user data (useful after backend operations that modify user state)
  refreshUser(): void {
    this.getUser(true).subscribe(() => {
      // Emit credit update event to notify components
      this.creditUpdateSubject.next();
    });
  }

  // Clears the cached user data (called on logout)
  clearUser(): void {
    this.user.next(null);
    this.inFlightRequest = null;
  }

}
