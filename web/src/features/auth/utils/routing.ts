import type { CoachRole } from '@/features/auth/types';
import { ADMIN_ROUTES, AUTH_ROUTES, COACH_ROUTES } from '@/features/auth/constants';

export function getDashboardPath(role: CoachRole): string {
  return role === 'admin' ? ADMIN_ROUTES.dashboard : COACH_ROUTES.dashboard;
}

export function resolvePostLoginPath(role: CoachRole, from?: string): string {
  const home = getDashboardPath(role);
  if (!from) return home;
  if (role === 'admin' && from.startsWith('/admin')) return from;
  if (role === 'coach' && from.startsWith('/coach')) return from;
  return home;
}

export function isAuthLoginPath(pathname: string): boolean {
  return pathname === AUTH_ROUTES.login || pathname === '/coach/login' || pathname === '/admin/login';
}
