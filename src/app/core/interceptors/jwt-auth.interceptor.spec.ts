import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtAuthInterceptor } from './jwt-auth.interceptor';

describe('jwtAuthInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;
  let logoutCalls: number;
  let navigation: unknown[] | null;

  beforeEach(() => {
    logoutCalls = 0;
    navigation = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtAuthInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            authorizationHeader: () => 'Bearer stored-token',
            logout: () => logoutCalls++,
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/tables',
            navigate: (...args: unknown[]) => {
              navigation = args;
              return Promise.resolve(true);
            },
          },
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds the stored Bearer authorization header to API requests', () => {
    httpClient.get('/api/tables').subscribe();
    const request = http.expectOne('/api/tables');
    expect(request.request.headers.get('Authorization')).toBe('Bearer stored-token');
    request.flush([]);
  });

  it('clears the session and returns to login after a 401', () => {
    httpClient.get('/api/tables').subscribe({ error: () => undefined });
    http.expectOne('/api/tables').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(logoutCalls).toBe(1);
    expect(navigation).not.toBeNull();
  });
});
