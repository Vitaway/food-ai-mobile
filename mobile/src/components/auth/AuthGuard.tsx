import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { resolveAuthTarget } from '@/utils/authRouting';

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
  const { hasCompletedOnboarding, isBootstrapReady } = useProfile();
  const requiresAuth = isApiConfigured();
  const pendingTarget = useRef<string | null>(null);

  const isBootstrapping = authLoading || (requiresAuth && isAuthenticated && !isBootstrapReady);

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
