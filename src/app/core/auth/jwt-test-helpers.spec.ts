/**
 * Shared test helpers (named *.spec.ts so it is excluded from the app build).
 */

/** Builds an unsigned JWT-shaped string for tests. */
export function fakeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

export const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

export function pastExp(): number {
  return Math.floor(Date.now() / 1000) - 3600;
}

export function storeUser(token: string, extra: Record<string, unknown> = {}): void {
  localStorage.setItem(
    'currentUser',
    JSON.stringify({ id: 'u1', userName: 'tester', token, refreshToken: 'r', ...extra })
  );
  localStorage.setItem('authToken', token);
}
