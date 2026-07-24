export type AuthRouteContext = {
  requiresAuth: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  needsPushPrompt?: boolean;
  root: string;
  authScreen?: string;
  second?: string;
};

function isIndexRoute(root: string) {
  return !root || root === 'index';
}

/** Pure routing resolver used by AuthGuard — exported for verification tests. */
export function resolveAuthTarget(opts: AuthRouteContext): string | null {
  const {
    requiresAuth,
    isAuthenticated,
    hasCompletedOnboarding,
    needsPushPrompt = false,
    root,
    authScreen,
    second,
  } = opts;
  const inAuth = root === 'auth';
  const inOnboarding = root === 'onboarding';
  const inPushEnable = root === 'notifications' && second === 'enable';
  const onResetPassword = authScreen === 'reset-password';

  if (!requiresAuth) {
    if (!hasCompletedOnboarding && !inOnboarding) return '/onboarding';
    if (hasCompletedOnboarding && needsPushPrompt && !inPushEnable) return '/notifications/enable';
    if (hasCompletedOnboarding && inOnboarding) return needsPushPrompt ? '/notifications/enable' : '/(tabs)';
    if (hasCompletedOnboarding && inPushEnable && !needsPushPrompt) return '/(tabs)';
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

  if (needsPushPrompt) {
    if (inPushEnable) return null;
    return '/notifications/enable';
  }

  if (inPushEnable) return '/(tabs)';
  if (inOnboarding) return '/(tabs)';
  if (inAuth && !onResetPassword) return '/(tabs)';
  if (isIndexRoute(root)) return '/(tabs)';

  return null;
}
