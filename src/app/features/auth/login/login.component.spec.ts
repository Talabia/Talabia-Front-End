import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../shared/services/language.service';

describe('LoginComponent (dashboard access)', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    localStorage.clear();
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['sendOtp']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  function create() {
    const fixture = TestBed.createComponent(LoginComponent);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    return { fixture, component: fixture.componentInstance, router };
  }

  it('shows the backend message on 403, stores nothing and resets the phone step', async () => {
    authSpy.sendOtp.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { code: 403, message: 'Backend says: not an admin' },
          })
      )
    );
    const { fixture, component, router } = create();
    component.emailOrPhone = '+966500000000';

    component.onSendOtp();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.authError()).toBe('Backend says: not an admin');
    expect(component.emailOrPhone).toBe('');
    expect(component.loading).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Backend says: not an admin');
  });

  it('falls back to the translated message when the 403 has no message', () => {
    authSpy.sendOtp.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const { component } = create();
    component.emailOrPhone = '+966500000000';

    component.onSendOtp();

    const expected = TestBed.inject(LanguageService).translate('auth.error.notAuthorized');
    expect(expected).not.toBe('auth.error.notAuthorized');
    expect(component.authError()).toBe(expected);
  });

  it('navigates to the OTP step on success', () => {
    authSpy.sendOtp.and.returnValue(of({ isVerified: true, userId: 'u1' }));
    const { component, router } = create();
    component.emailOrPhone = '+966500000000';

    component.onSendOtp();

    expect(router.navigate).toHaveBeenCalledWith(['/otp'], jasmine.anything());
    expect(component.authError()).toBeNull();
  });
});
