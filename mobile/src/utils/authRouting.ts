export type AuthRouteContext = {
  requiresAuth: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  needsPushPrompt?: boolean;
  /** When true, user must stay on subscription paywall until they have access. */
  needsSubscription?: boolean;
  isCoach?: boolean;
  root: string;
  authScreen?: string;
  second?: string;
};

function isIndexRoute(root: string) {
  return !root || root === 'index';
}

function isSubscriptionRoute(root: string, second?: string) {
  return root === 'profile' && second === 'subscription';
}

function homeRoute(isCoach: boolean) {
  return isCoach ? '/(coach)' : '/(tabs)';
}

/** Pure routing resolver used by AuthGuard — exported for verification tests. */
export function resolveAuthTarget(opts: AuthRouteContext): string | null {
  const {
    requiresAuth,
    isAuthenticated,
    hasCompletedOnboarding,
    needsPushPrompt = false,
    needsSubscription = false,
    isCoach = false,
    root,
    authScreen,
    second,
  } = opts;
  const inAuth = root === 'auth';
  const inOnboarding = root === 'onboarding';
  const inPushEnable = root === 'notifications' && second === 'enable';
  const onResetPassword = authScreen === 'reset-password';
  const onSubscription = isSubscriptionRoute(root, second);
  const home = homeRoute(isCoach);

  if (!requiresAuth) {
    if (!hasCompletedOnboarding && !inOnboarding) return '/onboarding';
    if (hasCompletedOnboarding && needsPushPrompt && !inPushEnable) return '/notifications/enable';
    if (hasCompletedOnboarding && inOnboarding) return needsPushPrompt ? '/notifications/enable' : home;
    if (hasCompletedOnboarding && inPushEnable && !needsPushPrompt) return home;
    return null;
  }

  if (!isAuthenticated) {
    return inAuth ? null : '/auth/login';
  }

  if (isCoach) {
    if (needsPushPrompt) {
      if (inPushEnable) return null;
      return '/notifications/enable';
    }
    if (inPushEnable) return home;
    if (inOnboarding) return home;
    if (inAuth && !onResetPassword) return home;
    if (isIndexRoute(root)) return home;
    if (root === '(tabs)') return home;
    return null;
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

  if (needsSubscription) {
    if (onSubscription) return null;
    return '/profile/subscription';
  }

  if (inPushEnable) return home;
  if (inOnboarding) return home;
  if (inAuth && !onResetPassword) return home;
  if (isIndexRoute(root)) return home;
  if (root === '(coach)') return home;

  return null;
}
