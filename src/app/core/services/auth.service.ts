import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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
}

export interface AuthResponse {
  userId: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.baseUrl}Auth`; // Uses http://talabiamotors.runasp.net/api/Auth

  // Signal to hold the current logged-in user
  currentUser = signal<User | null>(this.getUserFromStorage());

  // Computed signal to check if user is logged in
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() { }

  sendOtp(emailOrPhone: string, otpType: number = 2): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/send/otp`, {
      emailOrPhone,
      otpType,
    });
  }

  login(userId: string, otp: string): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/login`, {
        userId,
        otp,
      })
      .pipe(
        tap((user) => {
          this.setCurrentUser(user);
          localStorage.setItem('authToken', user.token);
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

  /**
   * Clear all auth-related data from storage and navigate to login
   */
  private clearAuthDataAndNavigate(): void {
    // Remove all auth-related keys from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    // localStorage.removeItem('darkMode');
    // localStorage.removeItem('hideSideBar');
    // localStorage.removeItem('sidebarState');

    // Clear user signal
    this.currentUser.set(null);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  updateTokens(token: string, refreshToken: string): void {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, token, refreshToken };
      this.setCurrentUser(updatedUser);
      localStorage.setItem('authToken', token);
    }
  }
}
