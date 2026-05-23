import '../../global.css';

import {
  NataSans_400Regular,
  NataSans_500Medium,
  NataSans_600SemiBold,
  NataSans_700Bold,
  useFonts,
} from '@expo-google-fonts/nata-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { AppProviders } from '@/context/AppProviders';
import { semanticColors } from '@/design-system/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NataSans_400Regular,
    NataSans_500Medium,
    NataSans_600SemiBold,
    NataSans_700Bold,
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: semanticColors.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meal" options={{ presentation: 'card' }} />
      </Stack>
    </AppProviders>
  );
}
