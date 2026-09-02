import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, BackendErrorBody } from '../models/api.models';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const body = (error.error ?? {}) as BackendErrorBody;
      return throwError(
        () =>
          new ApiError(
            humanMessage(error.status, body.message),
            error.status,
            body.validationErrors,
          ),
      );
    }),
  );

function humanMessage(status: number, backendMessage?: string): string {
  if (backendMessage?.trim()) return backendMessage;
  switch (status) {
    case 0:
      return 'The Tavoo API is unavailable. Check that the backend is running on port 8080.';
    case 400:
      return 'Some details are invalid. Review the form and try again.';
    case 401:
      return 'Your credentials are missing or no longer valid. Sign in again.';
    case 403:
      return 'Your role does not have permission to perform this action.';
    case 404:
      return 'The requested record could not be found.';
    case 409:
      return 'This action conflicts with the current table or order state.';
    default:
      return status >= 500
        ? 'The server could not complete the request. Please try again.'
        : 'The request could not be completed.';
  }
}
