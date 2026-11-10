import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DASHBOARD_ROLES } from '../auth/roles';
import { LanguageService } from '../../shared/services/language.service';

/** Toast key rendered by the global `<p-toast>` in the main layout. */
export const GLOBAL_TOAST_KEY = 'global';

const FORBIDDEN_TOAST_THROTTLE_MS = 3000;
let lastForbiddenToastAt = 0;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const messageService = inject(MessageService);
  const languageService = inject(LanguageService);
  const currentUser = authService.currentUser();
  const token = currentUser?.token;

  // Clone request to add Authorization header if token exists
  // Skip if request is already going to Auth API (except logout and refresh-token which need the token)
  let authReq = req;
  const isAuthApi = req.url.includes('/api/Auth/');
  const isLogoutOrRefresh = req.url.includes('/logout') || req.url.includes('/refresh-token');

  if (token && (!isAuthApi || isLogoutOrRefresh)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  const forceLogoutWith = (error: unknown) => {
    authService.forceLogout();
    return throwError(() => error);
  };

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Auth endpoints (send-OTP, login, refresh, logout) handle their own 401/403;
      // never run refresh/logout logic for them (a login 403 must reach the login screen untouched).
      if (isAuthApi) {
        return throwError(() => error);
      }

      // Handle 401 Unauthorized
      if (error.status === 401) {
        const user = authService.currentUser();
        if (user && user.token && user.refreshToken) {
          // Try to refresh the token
          return authService.refreshToken(user.token, user.refreshToken).pipe(
            switchMap((response) => {
              authService.updateTokens(response.token, response.refreshToken);
              // The refreshed token is authoritative: if the admin role was revoked, end the session.
              if (!authService.hasAnyRole(DASHBOARD_ROLES)) {
                return forceLogoutWith(error);
              }
              // Retry the original request with new token
              const newAuthReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.token}`,
                },
              });
              return next(newAuthReq);
            }),
            catchError((refreshError) => {
              // If refresh token fails, attempt to logout
              return authService.logout().pipe(
                catchError((logoutError) => {
                  // If logout API also fails, force logout by clearing storage
                  authService.forceLogout();
                  return throwError(() => logoutError);
                }),
                switchMap(() => {
                  return throwError(() => refreshError);
                })
              );
            })
          );
        } else {
          // No refresh token available, attempt logout
          return authService.logout().pipe(
            catchError((logoutError) => {
              // If logout fails, force logout
              authService.forceLogout();
              return throwError(() => logoutError);
            }),
            switchMap(() => {
              return throwError(() => error);
            })
          );
        }
      }

      // Handle 403 Forbidden from protected APIs
      if (error.status === 403) {
        if (authService.currentUser() && !authService.hasAnyRole(DASHBOARD_ROLES)) {
          // Session no longer has a dashboard role (e.g. revoked) → end it.
          return forceLogoutWith(error);
        }
        const now = Date.now();
        if (now - lastForbiddenToastAt > FORBIDDEN_TOAST_THROTTLE_MS) {
          lastForbiddenToastAt = now;
          messageService.add({
            key: GLOBAL_TOAST_KEY,
            severity: 'error',
            summary: languageService.translate('auth.error.forbiddenTitle'),
            detail:
              (error.error as { message?: string } | null)?.message ||
              languageService.translate('auth.error.forbidden'),
          });
        }
      }

      return throwError(() => error);
    })
  );
};
