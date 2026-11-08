import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import { DASHBOARD_ROLES } from '../auth/roles';
import { getRolesFromToken, isTokenExpired } from '../auth/jwt.util';

export interface User {
  id: string;
  companyName: string;
  userName: string;
  phone: string;
  email: string;
  profileImage: string;
  token: string;
  refreshToken: string;
  isVerified: boolean;
  notificationAllowed: boolean;
  roles?: string[];
}

export interface AuthResponse {
  isVerified?: boolean;
  userId: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

/** Backend error body shape: `{ code, message, description? }`. */
export interface ApiErrorBody {
  code?: number;
  message?: string;
  description?: string;
}

/**
 * Raised client-side when a login succeeds at the API level but the returned
 * user/token does not carry a dashboard role. Mirrors the backend 403 so the UI
 * can treat both identically.
 */
export class DashboardAccessDeniedError extends Error {
  readonly status = 403;
  constructor() {
    super('DashboardAccessDenied');
    this.name = 'DashboardAccessDeniedError';
  }
}

const STORAGE_USER_KEY = 'currentUser';
const STORAGE_TOKEN_KEY = 'authToken';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${inject(API_BASE_URL)}Auth`;

  // Signal to hold the current logged-in user
  currentUser = signal<User | null>(this.getUserFromStorage());

  // Computed signal to check if user is logged in
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Stale sessions: a token stored before role enforcement existed (or a Client
    // token placed manually) must not survive app start.
    if (this.currentUser() && !this.hasAnyRole(DASHBOARD_ROLES)) {
      this.clearSession();
    }
  }

  sendOtp(phone: string, otpType: number = 2): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/admin/send/otp`, {
      phone,
      otpType,
    });
  }

  /**
   * Verifies the OTP against the admin login endpoint. The session is only stored
   * when the returned user holds a dashboard role; otherwise nothing is persisted
   * and a {@link DashboardAccessDeniedError} is emitted.
   */
  login(userId: string, otp: string): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/admin/login`, {
        userId,
        otp,
      })
      .pipe(
        switchMap((user) => {
          const roles = AuthService.resolveRoles(user?.token, user?.roles);
          if (!user?.token || !roles.some((r) => DASHBOARD_ROLES.includes(r))) {
            // Defense in depth: never persist a non-admin session.
            return throwError(() => new DashboardAccessDeniedError());
          }
          const sessionUser: User = { ...user, roles };
          this.setCurrentUser(sessionUser);
          return of(sessionUser);
        })
      );
  }

  resendOtp(userId: string, otpType: number = 2): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend/otp`, {
      userId,
      otpType,
    });
  }

  refreshToken(token: string, refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, {
      token,
      refreshToken,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthDataAndNavigate();
      })
    );
  }

  /**
   * Force logout - clears auth data and navigates to login
   * Used when logout API fails or when refresh token fails
   */
  forceLogout(): void {
    this.clearAuthDataAndNavigate();
  }

  /** Clears all auth data without navigating (guards return their own UrlTree). */
  clearSession(): void {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    this.currentUser.set(null);
  }

  /**
   * Roles of the current session. The stored JWT is the source of truth; the roles
   * returned by the login response are only used when the token carries no role claim.
   */
  getRoles(): string[] {
    const user = this.currentUser();
    if (!user) {
      return [];
    }
    return AuthService.resolveRoles(user.token, user.roles);
  }

  /** True when the current session holds at least one of the given roles. */
  hasAnyRole(roles: readonly string[]): boolean {
    const userRoles = this.getRoles();
    return roles.some((role) => userRoles.includes(role));
  }

  /** True when the stored access token is missing or past its `exp`. */
  isTokenExpired(): boolean {
    return isTokenExpired(this.currentUser()?.token);
  }

  /**
   * Clear all auth-related data from storage and navigate to login
   */
  private clearAuthDataAndNavigate(): void {
    this.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_TOKEN_KEY, user.token);
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(STORAGE_USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  updateTokens(token: string, refreshToken: string): void {
    const user = this.currentUser();
    if (user) {
      // Roles must follow the new token; drop the cached response roles if the token has its own.
      const roles = AuthService.resolveRoles(token, user.roles);
      const updatedUser = { ...user, token, refreshToken, roles };
      this.setCurrentUser(updatedUser);
    }
  }

  private static resolveRoles(token: string | undefined, fallback: string[] | undefined): string[] {
    const fromToken = getRolesFromToken(token);
    if (fromToken) {
      return fromToken;
    }
    return Array.isArray(fallback) ? fallback.filter((r) => typeof r === 'string') : [];
  }
}
