import { NotificationMealSync } from '@/components/notifications/NotificationEffects';
import { PushNotificationSetup } from '@/components/notifications/PushNotificationSetup';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { MealsProvider } from '@/context/MealsContext';
import { ToastProvider } from '@/context/ToastContext';
import { IconoirProviderRoot } from '@/components/ui/IconoirIcon';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AppContext = createContext({ ready: true });

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <IconoirProviderRoot>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <ProfileProvider>
                  <MealsProvider>
                    <NotificationMealSync />
                    <PushNotificationSetup />
                    <AppContext.Provider value={{ ready: true }}>{children}</AppContext.Provider>
                  </MealsProvider>
                </ProfileProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </IconoirProviderRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
