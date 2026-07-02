import { Redirect, type Href } from 'expo-router';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';

export default function IndexScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return <AppSplashScreen />;
  }

  if (isApiConfigured() && !isAuthenticated) {
    return <Redirect href={'/auth/login' as Href} />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  return <Redirect href="/(tabs)" />;
}
