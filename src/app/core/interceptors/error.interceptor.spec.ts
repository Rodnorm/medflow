import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should pass through successful requests without opening snackbar', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTesting.expectOne('/api/test');
    req.flush({ success: true });

    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should open snackbar with error message and re-throw on HTTP error response', () => {
    let capturedError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        capturedError = err;
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Internal surgical server error' }, { status: 500, statusText: 'Server Error' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Internal surgical server error',
      'Dismiss',
      expect.objectContaining({
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
      }),
    );
    expect(capturedError?.status).toBe(500);
  });

  it('should fallback to HTTP status code when error body has no message', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'HTTP request failed with status 503',
      'Dismiss',
      expect.objectContaining({
        duration: 4000,
      }),
    );
  });
});

