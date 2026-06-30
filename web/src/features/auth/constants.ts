export const AUTH_STORAGE_KEY = 'mirafood-coach-auth';

export const COACH_ROUTES = {
  login: '/coach/login',
  forgotPassword: '/coach/forgot-password',
  dashboard: '/coach',
  queue: '/coach/queue',
  profile: '/coach/profile',
} as const;

/** Demo credentials — replace with real API auth in production */
export const DEMO_COACH_EMAIL = 'coach@vitaway.com';
export const DEMO_COACH_PASSWORD = 'coach1234';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
