import { Redirect, useSegments, type Href } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';

export function AuthGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useProfile();
  const segments = useSegments();

  const rootSegment = segments[0];
  const inAuthGroup = rootSegment === 'auth';
  const inOnboardingGroup = rootSegment === 'onboarding';
  const requiresAuth = isApiConfigured();
  const isBootstrapping = authLoading || profileLoading;

  if (!requiresAuth) {
    if (isBootstrapping) {
      return <AppSplashScreen />;
    }

    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      return <Redirect href={'/onboarding' as Href} />;
    }

    if (hasCompletedOnboarding && inOnboardingGroup) {
      return <Redirect href={'/(tabs)' as Href} />;
    }

    return children;
  }

  if (isBootstrapping) {
    return <AppSplashScreen />;
  }

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href={'/auth/login' as Href} />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href={'/' as Href} />;
  }

  if (isAuthenticated && !hasCompletedOnboarding && !inOnboardingGroup) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  if (isAuthenticated && hasCompletedOnboarding && inOnboardingGroup) {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return children;
}
