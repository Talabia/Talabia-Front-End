/**
 * Single source of truth for role names used by the admin dashboard.
 * Role names are case-sensitive and must match the backend exactly.
 */
export const AppRole = {
  Admin: 'Admin',
  SuperAdmin: 'SuperAdmin',
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

/** Roles allowed to access the dashboard at all (login + the whole protected shell). */
export const DASHBOARD_ROLES: readonly string[] = [AppRole.Admin, AppRole.SuperAdmin];
