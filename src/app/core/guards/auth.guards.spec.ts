import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthUser } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard, roleGuard } from './auth.guards';

describe('authentication guards', () => {
  const waiter: AuthUser = { id: 7, username: 'maria', role: 'WAITER' };
  let currentUser: AuthUser | null;

  beforeEach(() => {
    currentUser = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            restoreSession: () => of(currentUser),
            landingRoute: (role: AuthUser['role']) =>
              role === 'KITCHEN' ? '/kitchen' : '/dashboard',
          },
        },
      ],
    });
  });

  const resolve = (result: unknown) => firstValueFrom(result as Observable<boolean | UrlTree>);

  it('redirects unauthenticated users to login and preserves their destination', async () => {
    const result = await resolve(
      TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url: '/orders?table=4' } as RouterStateSnapshot),
      ),
    );

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Forders%3Ftable%3D4',
    );
  });

  it('allows users with an accepted role and rejects other authenticated users', async () => {
    currentUser = waiter;
    const state = { url: '/admin/users' } as RouterStateSnapshot;

    const allowed = await resolve(
      TestBed.runInInjectionContext(() =>
        roleGuard({ data: { roles: ['WAITER'] } } as unknown as ActivatedRouteSnapshot, state),
      ),
    );
    const rejected = await resolve(
      TestBed.runInInjectionContext(() =>
        roleGuard({ data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot, state),
      ),
    );

    expect(allowed).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(rejected as UrlTree)).toBe('/forbidden');
  });

  it('keeps guests on public pages and sends authenticated users home', async () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/login' } as RouterStateSnapshot;
    const guestResult = await resolve(
      TestBed.runInInjectionContext(() => guestGuard(route, state)),
    );
    currentUser = waiter;
    const userResult = await resolve(TestBed.runInInjectionContext(() => guestGuard(route, state)));

    expect(guestResult).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(userResult as UrlTree)).toBe('/dashboard');
  });
});
