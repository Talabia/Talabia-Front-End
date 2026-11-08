import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import {
  MS_ROLE_CLAIM,
  fakeJwt,
  futureExp,
  pastExp,
  storeUser,
} from '../auth/jwt-test-helpers.spec';

describe('authGuard', () => {
  const state = { url: '/en/users/user-management' } as RouterStateSnapshot;

  function route(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
    return {
      data,
      paramMap: convertToParamMap({ lang: 'en' }),
      parent: null,
    } as unknown as ActivatedRouteSnapshot;
  }

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    return { auth: TestBed.inject(AuthService), router: TestBed.inject(Router) };
  }

  function run(r = route()) {
    return TestBed.runInInjectionContext(() => authGuard(r, state));
  }

  function urlOf(result: unknown, router: Router): string {
    expect(result instanceof UrlTree).withContext('expected a UrlTree redirect').toBeTrue();
    return router.serializeUrl(result as UrlTree);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('allows an Admin token', () => {
    storeUser(fakeJwt({ role: 'Admin', exp: futureExp() }));
    setup();
    expect(run()).toBeTrue();
  });

  it('allows a SuperAdmin token using the MS role claim array', () => {
    storeUser(fakeJwt({ [MS_ROLE_CLAIM]: ['Client', 'SuperAdmin'], exp: futureExp() }));
    setup();
    expect(run()).toBeTrue();
  });

  it('redirects to /login and clears the session for a Client token', () => {
    const { auth, router } = setup();
    // Simulate a Client session appearing after app start (bypasses the startup cleanup).
    storeUser(fakeJwt({ role: 'Client', exp: futureExp() }));
    auth.currentUser.set(JSON.parse(localStorage.getItem('currentUser')!));

    const url = urlOf(run(), router);
    expect(url).toContain('/login');
    expect(url).toContain('returnUrl=');
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('redirects to /login when there is no token', () => {
    const { router } = setup();
    expect(urlOf(run(), router)).toContain('/login');
  });

  it('redirects to /login when the token is expired and there is no refresh token', () => {
    storeUser(fakeJwt({ role: 'Admin', exp: pastExp() }), { refreshToken: '' });
    const { auth, router } = setup();
    expect(urlOf(run(), router)).toContain('/login');
    expect(auth.currentUser()).toBeNull();
  });

  it('lets an expired Admin token with a refresh token through (interceptor refreshes it)', () => {
    storeUser(fakeJwt({ role: 'Admin', exp: pastExp() }));
    setup();
    expect(run()).toBeTrue();
  });

  it('honours per-route data.roles without ending the admin session', () => {
    storeUser(fakeJwt({ role: 'Admin', exp: futureExp() }));
    const { auth, router } = setup();
    expect(urlOf(run(route({ roles: ['SuperAdmin'] })), router)).toBe('/en');
    expect(auth.currentUser()).not.toBeNull();
  });
});
