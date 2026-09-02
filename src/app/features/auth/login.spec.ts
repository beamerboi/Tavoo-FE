import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let loginArguments: unknown[] | null;

  beforeEach(async () => {
    loginArguments = null;
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: (...args: unknown[]) => {
              loginArguments = args;
              return of({ id: 4, username: 'maria', role: 'WAITER' });
            },
            landingRoute: () => '/dashboard',
          },
        },
        {
          provide: Router,
          useValue: { navigateByUrl: () => Promise.resolve(true) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('leaves Remember me unchecked by default', () => {
    expect(fixture.componentInstance.form.controls.rememberMe.value).toBe(false);
  });

  it('sends the selected Remember me value during sign-in', () => {
    fixture.componentInstance.form.setValue({
      username: 'maria',
      password: 'password123',
      rememberMe: true,
    });

    fixture.componentInstance.submit();

    expect(loginArguments).toEqual(['maria', 'password123', true]);
  });
});
