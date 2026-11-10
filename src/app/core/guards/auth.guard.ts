import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DASHBOARD_ROLES } from '../auth/roles';

/**
 * Protects dashboard routes.
 *
 * - No session → `/login?returnUrl=...`
 * - Access token expired and no refresh token to recover with → clear session, `/login`
 *   (an expired token *with* a refresh token is let through; the auth interceptor refreshes it on the first 401)
 * - Session without any dashboard role (Admin/SuperAdmin) → clear session, `/login`
 * - Route declares `data: { roles: [...] }` the admin lacks → back to the dashboard home
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toLogin = () =>
    router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  const user = authService.currentUser();
  if (!user?.token) {
    return toLogin();
  }

  if (authService.isTokenExpired() && !user.refreshToken) {
    authService.clearSession();
    return toLogin();
  }

  if (!authService.hasAnyRole(DASHBOARD_ROLES)) {
    authService.clearSession();
    return toLogin();
  }

  const routeRoles = route.data?.['roles'] as readonly string[] | undefined;
  if (routeRoles?.length && !authService.hasAnyRole(routeRoles)) {
    const lang = route.paramMap.get('lang') ?? route.parent?.paramMap.get('lang') ?? 'ar';
    return router.createUrlTree([`/${lang}`]);
  }

  return true;
};
