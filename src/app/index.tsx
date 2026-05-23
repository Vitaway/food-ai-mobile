import { Redirect, type Href } from 'expo-router';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { useProfile } from '@/context/ProfileContext';

export default function IndexScreen() {
  const { hasCompletedOnboarding, isLoading } = useProfile();

  if (isLoading) {
    return <AppSplashScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  return <Redirect href="/(tabs)" />;
}
