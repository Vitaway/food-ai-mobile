export const AUTH_STORAGE_KEY = 'mirafood-coach-auth';

export const AUTH_ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
} as const;

export const COACH_ROUTES = {
  dashboard: '/coach',
  queue: '/coach/queue',
  history: '/coach/history',
  clients: '/coach/clients',
  nutritionDb: '/coach/nutrition-db',
  reports: '/coach/reports',
  team: '/coach/team',
  profile: '/coach/profile',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  users: '/admin/users',
  usersCoaches: '/admin/users?type=coach',
  userDetail: (id: string) => `/admin/users/${id}`,
  organizations: '/admin/organizations',
  organizationDetail: (id: string) => `/admin/organizations/${id}`,
  payments: '/admin/payments',
  reports: '/admin/reports',
  referrals: '/admin/referrals',
  foodDb: '/admin/food-db',
  modules: '/admin/modules',
  assessments: '/admin/assessments',
  messages: '/admin/messages',
  profile: '/admin/profile',
  system: '/admin/system',
} as const;

export const CONSUMER_ROUTES = {
  dashboard: '/app',
  meals: '/app/meals',
  profile: '/app/profile',
} as const;

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
