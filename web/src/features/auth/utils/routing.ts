import type { UserRole } from '@/features/auth/types';
import { ADMIN_ROUTES, AUTH_ROUTES, COACH_ROUTES, CONSUMER_ROUTES } from '@/features/auth/constants';

export function getDashboardPath(role: UserRole): string {
  if (role === 'admin') return ADMIN_ROUTES.dashboard;
  if (role === 'consumer') return CONSUMER_ROUTES.dashboard;
  return COACH_ROUTES.dashboard;
}

export function resolvePostLoginPath(role: UserRole, from?: string): string {
  const home = getDashboardPath(role);
  if (!from) return home;
  if (role === 'admin' && from.startsWith('/admin')) return from;
  if (role === 'coach' && from.startsWith('/coach')) return from;
  if (role === 'consumer' && from.startsWith('/app')) return from;
  return home;
}

export function isAuthLoginPath(pathname: string): boolean {
  return (
    pathname === AUTH_ROUTES.login ||
    pathname === AUTH_ROUTES.register ||
    pathname === '/coach/login' ||
    pathname === '/admin/login'
  );
}
