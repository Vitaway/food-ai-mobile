export type AuthRouteContext = {
  requiresAuth: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenWelcome?: boolean;
  needsPushPrompt?: boolean;
  /** @deprecated Soft freemium: do not hard-route to paywall. Kept for callers; ignored. */
  needsSubscription?: boolean;
  isCoach?: boolean;
  root: string;
  authScreen?: string;
  second?: string;
};

function isIndexRoute(root: string) {
  return !root || root === 'index';
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
    hasSeenWelcome = true,
    needsPushPrompt = false,
    isCoach = false,
    root,
    authScreen,
    second,
  } = opts;
  const inAuth = root === 'auth';
  const inOnboarding = root === 'onboarding';
  const inWelcome = root === 'welcome';
  const inPushEnable = root === 'notifications' && second === 'enable';
  const onResetPassword = authScreen === 'reset-password';
  const home = homeRoute(isCoach);

  if (!requiresAuth) {
    if (!hasCompletedOnboarding && !inOnboarding) return '/onboarding';
    if (hasCompletedOnboarding && needsPushPrompt && !inPushEnable) return '/notifications/enable';
    if (hasCompletedOnboarding && inOnboarding) return needsPushPrompt ? '/notifications/enable' : home;
    if (hasCompletedOnboarding && inPushEnable && !needsPushPrompt) return home;
    return null;
  }

  if (!isAuthenticated) {
    if (onResetPassword) return inAuth ? null : '/auth/reset-password';
    // Logged-out home is always welcome; auth sheets sit on top.
    if (inWelcome || inAuth) return null;
    return '/welcome';
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

  // Freemium: free users browse the app; paid actions soft-lock separately.

  if (inPushEnable) return home;
  if (inOnboarding) return home;
  if (inAuth && !onResetPassword) return home;
  if (isIndexRoute(root)) return home;
  if (root === '(coach)') return home;

  return null;
}
