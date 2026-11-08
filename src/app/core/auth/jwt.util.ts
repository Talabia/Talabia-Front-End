/**
 * Minimal JWT helpers (no signature verification — the backend is the authority;
 * these are only used for client-side routing decisions).
 */

const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

export function decodeJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Returns the role claims in the token, or `null` when the token carries no role claim at all
 * (so callers can distinguish "no roles" from "roles not present in token").
 */
export function getRolesFromToken(token: string | null | undefined): string[] | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }
  let found = false;
  const roles: string[] = [];
  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (value === undefined || value === null) {
      continue;
    }
    found = true;
    if (Array.isArray(value)) {
      roles.push(...value.filter((v): v is string => typeof v === 'string'));
    } else if (typeof value === 'string') {
      roles.push(value);
    }
  }
  return found ? Array.from(new Set(roles)) : null;
}

/** True when the token has an `exp` claim in the past (with a small clock-skew allowance). */
export function isTokenExpired(token: string | null | undefined, skewSeconds = 10): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }
  const exp = payload['exp'];
  if (typeof exp !== 'number') {
    return false;
  }
  return exp * 1000 <= Date.now() - skewSeconds * 1000;
}
