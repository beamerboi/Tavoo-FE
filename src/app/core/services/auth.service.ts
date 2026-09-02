import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthUser, LoginRequest, TokenResponse, UserRole } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'tavoo.jwt-session';
  private readonly token = signal<TokenResponse | null>(this.readToken());

  readonly user = signal<AuthUser | null>(null);

  login(username: string, password: string, rememberMe = false): Observable<AuthUser> {
    const request: LoginRequest = { username, password, rememberMe };
    return this.http.post<TokenResponse>(`${API_BASE_URL}/api/auth/login`, request).pipe(
      switchMap((token) =>
        this.http
          .get<AuthUser>(`${API_BASE_URL}/api/auth/me`, {
            headers: new HttpHeaders({ Authorization: this.toAuthorization(token) }),
          })
          .pipe(
            tap((user) => this.setSession(token, user)),
            catchError((error: unknown) => {
              this.logout();
              return throwError(() => error);
            }),
          ),
      ),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    if (this.user()) return of(this.user());
    if (!this.authorizationHeader()) return of(null);
    return this.http.get<AuthUser>(`${API_BASE_URL}/api/auth/me`).pipe(
      tap((user) => this.user.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    this.user.set(null);
    this.clearStoredTokens();
  }

  authorizationHeader(): string | null {
    const token = this.token();
    if (!token) return null;
    if (this.isExpired(token)) {
      this.logout();
      return null;
    }
    return this.toAuthorization(token);
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
    const role = this.user()?.role;
    return !!role && roles.includes(role);
  }

  landingRoute(role = this.user()?.role): string {
    return role === 'KITCHEN' ? '/kitchen' : '/dashboard';
  }

  private setSession(token: TokenResponse, user: AuthUser): void {
    this.clearStoredTokens();
    this.token.set(token);
    this.user.set(user);
    try {
      const storage = token.rememberMe ? localStorage : sessionStorage;
      storage.setItem(this.storageKey, JSON.stringify(token));
    } catch {
      // The JWT remains available in memory when browser storage is unavailable.
    }
  }

  private readToken(): TokenResponse | null {
    const stored = this.readFromStorage(localStorage) ?? this.readFromStorage(sessionStorage);
    if (!stored || this.isExpired(stored)) {
      this.clearStoredTokens();
      return null;
    }
    return stored;
  }

  private readFromStorage(storage: Storage): TokenResponse | null {
    try {
      const value: unknown = JSON.parse(storage.getItem(this.storageKey) ?? 'null');
      if (!value || typeof value !== 'object') return null;
      const token = value as Partial<TokenResponse>;
      return typeof token.accessToken === 'string' &&
        typeof token.tokenType === 'string' &&
        typeof token.expiresAt === 'string' &&
        typeof token.rememberMe === 'boolean'
        ? (token as TokenResponse)
        : null;
    } catch {
      return null;
    }
  }

  private clearStoredTokens(): void {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
    } catch {
      // In-memory logout still succeeds when storage is unavailable.
    }
  }

  private isExpired(token: TokenResponse): boolean {
    const expiresAt = Date.parse(token.expiresAt);
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
  }

  private toAuthorization(token: TokenResponse): string {
    return `${token.tokenType || 'Bearer'} ${token.accessToken}`;
  }
}
