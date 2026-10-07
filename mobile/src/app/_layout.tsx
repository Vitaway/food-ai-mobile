import '../../global.css';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProviders } from '@/context/AppProviders';
import { configureNotificationHandler } from '@/services/push/expoNotifications';
import { semanticColors } from '@/design-system/colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <AppProviders>
      <AuthGuard>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: semanticColors.background },
            animation: 'fade_from_bottom',
            animationDuration: 280,
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="auth"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              animationDuration: 180,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              animationDuration: 180,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="notifications/index" />
          <Stack.Screen name="notifications/enable" options={{ gestureEnabled: false }} />
          <Stack.Screen name="water/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="story/index" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="widgets/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="referral/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(coach)" />
          <Stack.Screen name="coach" options={{ presentation: 'card' }} />
          <Stack.Screen name="meal" options={{ presentation: 'card' }} />
          <Stack.Screen name="chat" options={{ presentation: 'card' }} />
        </Stack>
      </AuthGuard>
    </AppProviders>
  );
}
