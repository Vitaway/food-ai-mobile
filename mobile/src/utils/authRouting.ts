export type AuthRouteContext = {
  requiresAuth: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  root: string;
  authScreen?: string;
};

function isIndexRoute(root: string) {
  return !root || root === 'index';
}

/** Pure routing resolver used by AuthGuard — exported for verification tests. */
export function resolveAuthTarget(opts: AuthRouteContext): string | null {
  const { requiresAuth, isAuthenticated, hasCompletedOnboarding, root, authScreen } = opts;
  const inAuth = root === 'auth';
  const inOnboarding = root === 'onboarding';
  const onResetPassword = authScreen === 'reset-password';

  if (!requiresAuth) {
    if (!hasCompletedOnboarding && !inOnboarding) return '/onboarding';
    if (hasCompletedOnboarding && inOnboarding) return '/(tabs)';
    return null;
  }

  if (!isAuthenticated) {
    return inAuth ? null : '/auth/login';
  }

  if (!hasCompletedOnboarding) {
    if (inOnboarding) return null;
    if (inAuth && onResetPassword) return null;
    return '/onboarding';
  }

  if (inOnboarding) return '/(tabs)';
  if (inAuth && !onResetPassword) return '/(tabs)';
  if (isIndexRoute(root)) return '/(tabs)';

  return null;
}
