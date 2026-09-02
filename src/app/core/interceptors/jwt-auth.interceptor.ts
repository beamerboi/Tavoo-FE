import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

export const jwtAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authorization = auth.authorizationHeader();
  const isApiRequest = request.url.startsWith(`${API_BASE_URL}/api/`);
  const isLoginRequest = request.url === `${API_BASE_URL}/api/auth/login`;
  const authenticatedRequest =
    isApiRequest && !isLoginRequest && authorization && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: authorization } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        authorization &&
        authenticatedRequest.headers.get('Authorization') === authorization
      ) {
        auth.logout();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
