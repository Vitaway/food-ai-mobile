import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { resolveAuthTarget } from '@/utils/authRouting';
import { hasSeenPushPrompt, subscribePushPromptSeen } from '@/utils/pushPrompt';

function isAtTarget(target: string, root: string, second?: string): boolean {
  if (target === '/onboarding') return root === 'onboarding';
  if (target === '/auth/login') return root === 'auth';
  if (target === '/(tabs)') return root === '(tabs)';
  if (target === '/notifications/enable') return root === 'notifications' && second === 'enable';
  return false;
}

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const root = segments[0] ?? '';
  const authScreen = segments[1];
  const second = segments[1];
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isBootstrapReady } = useProfile();
  const requiresAuth = isApiConfigured();
  const pendingTarget = useRef<string | null>(null);
  const pendingAt = useRef(0);
  const [pushPromptReady, setPushPromptReady] = useState(false);
  const [needsPushPrompt, setNeedsPushPrompt] = useState(false);

  const isBootstrapping =
    authLoading ||
    (requiresAuth && isAuthenticated && !isBootstrapReady) ||
    (isAuthenticated && hasCompletedOnboarding && !pushPromptReady);

  // Load push-prompt flag once per auth/onboarding session — not on every route change.
  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !hasCompletedOnboarding) {
      setNeedsPushPrompt(false);
      setPushPromptReady(true);
      return;
    }
    setPushPromptReady(false);
    void hasSeenPushPrompt().then((seen) => {
      if (!active) return;
      setNeedsPushPrompt(!seen);
      setPushPromptReady(true);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, hasCompletedOnboarding]);

  // Stay in sync when Enable / Not now marks the prompt seen (avoid bounce-back loop).
  useEffect(() => {
    return subscribePushPromptSeen((seen) => {
      setNeedsPushPrompt(!seen);
      setPushPromptReady(true);
    });
  }, []);

  useEffect(() => {
    if (isBootstrapping) return;

    const target = resolveAuthTarget({
      requiresAuth,
      isAuthenticated,
      hasCompletedOnboarding,
      needsPushPrompt,
      root,
      authScreen,
      second,
    });

    if (!target || isAtTarget(target, root, second)) {
      pendingTarget.current = null;
      pendingAt.current = 0;
      return;
    }

    const now = Date.now();
    // Allow retry if the same target has been pending >2s without landing.
    if (pendingTarget.current === target && now - pendingAt.current < 2000) return;

    pendingTarget.current = target;
    pendingAt.current = now;
    router.replace(target as Href);
  }, [
    isBootstrapping,
    requiresAuth,
    isAuthenticated,
    hasCompletedOnboarding,
    needsPushPrompt,
    root,
    authScreen,
    second,
    router,
  ]);

  useEffect(() => {
    if (pendingTarget.current && isAtTarget(pendingTarget.current, root, second)) {
      pendingTarget.current = null;
      pendingAt.current = 0;
    }
  }, [root, second]);

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
