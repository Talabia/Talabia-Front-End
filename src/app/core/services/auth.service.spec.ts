import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService, DashboardAccessDeniedError } from './auth.service';
import { API_BASE_URL } from '../tokens/api-base-url.token';
import { fakeJwt, futureExp, storeUser } from '../auth/jwt-test-helpers.spec';

describe('AuthService', () => {
  const base = 'http://api.test/api/';

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: base },
      ],
    });
    return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('uses the admin send-OTP endpoint', () => {
    const { auth, http } = setup();
    auth.sendOtp('+966500000000').subscribe();
    const req = http.expectOne(`${base}Auth/admin/send/otp`);
    expect(req.request.body).toEqual({ phone: '+966500000000', otpType: 2 });
  });

  it('stores the session for an Admin login', () => {
    const { auth, http } = setup();
    const token = fakeJwt({ role: 'Admin', exp: futureExp() });
    auth.login('u1', '123456').subscribe();
    http
      .expectOne(`${base}Auth/admin/login`)
      .flush({ id: 'u1', token, refreshToken: 'r', roles: ['Admin'] });
    expect(localStorage.getItem('authToken')).toBe(token);
    expect(auth.hasAnyRole(['Admin'])).toBeTrue();
  });

  it('falls back to JWT roles when the response has no roles', () => {
    const { auth, http } = setup();
    const token = fakeJwt({ role: ['SuperAdmin'], exp: futureExp() });
    auth.login('u1', '123456').subscribe();
    http.expectOne(`${base}Auth/admin/login`).flush({ id: 'u1', token, refreshToken: 'r' });
    expect(auth.hasAnyRole(['SuperAdmin'])).toBeTrue();
  });

  it('uses response roles when the JWT carries no role claim', () => {
    const { auth, http } = setup();
    const token = fakeJwt({ sub: 'u1', exp: futureExp() });
    auth.login('u1', '123456').subscribe();
    http
      .expectOne(`${base}Auth/admin/login`)
      .flush({ id: 'u1', token, refreshToken: 'r', roles: ['Admin'] });
    expect(auth.hasAnyRole(['Admin'])).toBeTrue();
  });

  it('rejects a 200 login without a dashboard role and stores nothing', () => {
    const { auth, http } = setup();
    let error: unknown;
    auth.login('u1', '123456').subscribe({ error: (e) => (error = e) });
    http.expectOne(`${base}Auth/admin/login`).flush({
      id: 'u1',
      token: fakeJwt({ role: 'Client' }),
      refreshToken: 'r',
      roles: ['Client'],
    });
    expect(error).toBeInstanceOf(DashboardAccessDeniedError);
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('does not trust response roles when the JWT says Client', () => {
    const { auth, http } = setup();
    let error: unknown;
    auth.login('u1', '123456').subscribe({ error: (e) => (error = e) });
    http.expectOne(`${base}Auth/admin/login`).flush({
      id: 'u1',
      token: fakeJwt({ role: 'Client' }),
      refreshToken: 'r',
      roles: ['Admin'],
    });
    expect(error).toBeInstanceOf(DashboardAccessDeniedError);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('clears a stale non-admin session on start', () => {
    storeUser(fakeJwt({ role: 'Client', exp: futureExp() }));
    const { auth } = setup();
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('keeps an admin session on start', () => {
    storeUser(fakeJwt({ role: 'Admin', exp: futureExp() }));
    const { auth } = setup();
    expect(auth.currentUser()).not.toBeNull();
  });
});
