import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TokenResponse } from '../models/api.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const storageKey = 'tavoo.jwt-session';
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('logs in with JWT and defaults to browser-tab storage', () => {
    const token = createToken(false);

    auth.login('maria', 'password123').subscribe();
    const login = http.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({
      username: 'maria',
      password: 'password123',
      rememberMe: false,
    });
    login.flush(token);

    const me = http.expectOne('/api/auth/me');
    expect(me.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    me.flush({ id: 4, username: 'maria', role: 'WAITER' });

    expect(auth.user()).toEqual({ id: 4, username: 'maria', role: 'WAITER' });
    expect(auth.authorizationHeader()).toBe('Bearer jwt-token');
    expect(sessionStorage.getItem(storageKey)).toBe(JSON.stringify(token));
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(auth.hasAnyRole(['WAITER'])).toBe(true);
    expect(auth.hasAnyRole(['ADMIN', 'KITCHEN'])).toBe(false);
  });

  it('persists a remembered JWT across browser restarts', () => {
    const token = createToken(true);

    auth.login('admin', 'password123', true).subscribe();
    const login = http.expectOne('/api/auth/login');
    expect(login.request.body.rememberMe).toBe(true);
    login.flush(token);
    http.expectOne('/api/auth/me').flush({ id: 1, username: 'admin', role: 'ADMIN' });

    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(token));
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('clears the JWT and current user on logout', () => {
    const token = createToken(false);
    auth.login('admin', 'password123').subscribe();
    http.expectOne('/api/auth/login').flush(token);
    http.expectOne('/api/auth/me').flush({ id: 1, username: 'admin', role: 'ADMIN' });

    auth.logout();

    expect(auth.user()).toBeNull();
    expect(auth.authorizationHeader()).toBeNull();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  function createToken(rememberMe: boolean): TokenResponse {
    return {
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      rememberMe,
    };
  }
});
