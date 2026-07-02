import '../../global.css';

import {
  CabinSketch_400Regular,
  CabinSketch_700Bold,
} from '@expo-google-fonts/cabin-sketch';
import { Sniglet_400Regular, Sniglet_800ExtraBold } from '@expo-google-fonts/sniglet';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProviders } from '@/context/AppProviders';
import { semanticColors } from '@/design-system/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
    CabinSketch_400Regular,
    CabinSketch_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <AppSplashScreen />;
  }

  return (
    <AppProviders>
      <AuthGuard>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: semanticColors.background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="water" options={{ presentation: 'card' }} />
          <Stack.Screen name="referral" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="meal" options={{ presentation: 'card' }} />
          <Stack.Screen name="ar-measure" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </AuthGuard>
    </AppProviders>
  );
}
