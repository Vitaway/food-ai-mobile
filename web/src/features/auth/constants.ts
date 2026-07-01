export const AUTH_STORAGE_KEY = 'mirafood-coach-auth';

export const AUTH_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
} as const;

export const COACH_ROUTES = {
  dashboard: '/coach',
  queue: '/coach/queue',
  profile: '/coach/profile',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  coaches: '/admin/coaches',
  users: '/admin/users',
  system: '/admin/system',
} as const;

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
