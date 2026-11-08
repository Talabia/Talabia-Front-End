import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, DashboardAccessDeniedError } from '../services/auth.service';

/** Navigation-state key used to carry an access-denied message back to the login screen. */
export const LOGIN_ERROR_STATE_KEY = 'loginError';

/** True for a backend 403 from the admin auth endpoints or the client-side role check. */
export function isDashboardAccessDenied(error: unknown): boolean {
  return (
    error instanceof DashboardAccessDeniedError ||
    (error instanceof HttpErrorResponse && error.status === 403)
  );
}

/** Backend-localized `message` when present, otherwise the given translated fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as ApiErrorBody | null)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}
