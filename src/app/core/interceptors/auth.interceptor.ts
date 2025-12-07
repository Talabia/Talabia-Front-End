import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !authReq.url.includes('/refresh-token')) {
        const user = authService.currentUser();
        if (user && user.token && user.refreshToken) {
          // Try to refresh the token
          return authService.refreshToken(user.token, user.refreshToken).pipe(
            switchMap((response) => {
              authService.updateTokens(response.token, response.refreshToken);
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
      return throwError(() => error);
    })
  );
};
