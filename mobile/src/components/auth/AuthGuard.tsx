import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';

function isIndexRoute(root: string) {
  return !root || root === 'index';
}

function resolveAuthTarget(opts: {
  requiresAuth: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  root: string;
  authScreen?: string;
}): string | null {
  const { requiresAuth, isAuthenticated, hasCompletedOnboarding, root, authScreen } = opts;
  const inAuth = root === 'auth';
  const inOnboarding = root === 'onboarding';
  const inTabs = root === '(tabs)';
  const onResetPassword = authScreen === 'reset-password';

  if (!requiresAuth) {
    if (!hasCompletedOnboarding && !inOnboarding) return '/onboarding';
    if (hasCompletedOnboarding && inOnboarding) return '/(tabs)';
    return null;
  }

  if (!isAuthenticated) {
    return inAuth ? null : '/auth/login';
  }

  if (inAuth && !onResetPassword) {
    return hasCompletedOnboarding ? '/(tabs)' : '/onboarding';
  }

  if (!hasCompletedOnboarding && !inOnboarding && !inAuth) {
    return '/onboarding';
  }

  if (hasCompletedOnboarding && inOnboarding) {
    return '/(tabs)';
  }

  if (hasCompletedOnboarding && inTabs) {
    return null;
  }

  if (hasCompletedOnboarding && isIndexRoute(root)) {
    return '/(tabs)';
  }

  if (!isAuthenticated && isIndexRoute(root)) {
    return requiresAuth ? '/auth/login' : '/onboarding';
  }

  return null;
}

function isAtTarget(target: string, root: string): boolean {
  if (target === '/onboarding') return root === 'onboarding';
  if (target === '/auth/login') return root === 'auth';
  if (target === '/(tabs)') return root === '(tabs)';
  return false;
}

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const root = segments[0] ?? '';
  const authScreen = segments[1];
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useProfile();
  const requiresAuth = isApiConfigured();
  const pendingTarget = useRef<string | null>(null);

  const isBootstrapping = authLoading || (requiresAuth && isAuthenticated && profileLoading);

  useEffect(() => {
    if (isBootstrapping) return;

    const target = resolveAuthTarget({
      requiresAuth,
      isAuthenticated,
      hasCompletedOnboarding,
      root,
      authScreen,
    });

    if (!target || isAtTarget(target, root)) {
      pendingTarget.current = null;
      return;
    }

    if (pendingTarget.current === target) return;

    pendingTarget.current = target;
    router.replace(target as Href);
  }, [
    isBootstrapping,
    requiresAuth,
    isAuthenticated,
    hasCompletedOnboarding,
    root,
    authScreen,
    router,
  ]);

  useEffect(() => {
    if (pendingTarget.current && isAtTarget(pendingTarget.current, root)) {
      pendingTarget.current = null;
    }
  }, [root]);

  return (
    <View style={styles.root}>
      {children}
      {isBootstrapping ? (
        <View style={styles.splashOverlay}>
          <AppSplashScreen />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
