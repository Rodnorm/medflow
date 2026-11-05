import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: unknown) => {
      let errorMessage = 'An unexpected operational error occurred.';

      if (error instanceof HttpErrorResponse) {
        errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' && error.error.length > 0
            ? error.error
            : `HTTP request failed with status ${error.status}`);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      snackBar.open(errorMessage, 'Dismiss', {
        duration: 4000,
        verticalPosition: 'bottom',
        horizontalPosition: 'right',
      });

      return throwError(() => error);
    }),
  );
};
