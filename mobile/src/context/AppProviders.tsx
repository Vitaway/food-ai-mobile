import { LiveToastBridge } from '@/components/notifications/LiveToastBridge';
import { NotificationCoachQueueSync, NotificationMealSync } from '@/components/notifications/NotificationEffects';
import { PushNotificationSetup } from '@/components/notifications/PushNotificationSetup';
import { SubscriptionGate } from '@/components/auth/SubscriptionGate';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { MealsProvider } from '@/context/MealsContext';
import { SubscriptionAccessProvider } from '@/context/SubscriptionAccessContext';
import { CoachQueueRealtimeProvider } from '@/context/CoachQueueRealtimeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmDialogProvider } from '@/context/ConfirmDialogContext';
import { LocaleProvider } from '@/context/LocaleContext';
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
            <LocaleProvider>
            <ConfirmDialogProvider>
              <AuthProvider>
                <SubscriptionAccessProvider>
                  <NotificationProvider>
                    <ChatProvider>
                      <ProfileProvider>
                        <MealsProvider>
                          <NotificationMealSync />
                          <PushNotificationSetup />
                          <LiveToastBridge />
                          <CoachQueueRealtimeProvider>
                            <SubscriptionGate />
                            <NotificationCoachQueueSync />
                            <AppContext.Provider value={{ ready: true }}>{children}</AppContext.Provider>
                          </CoachQueueRealtimeProvider>
                        </MealsProvider>
                      </ProfileProvider>
                    </ChatProvider>
                  </NotificationProvider>
                </SubscriptionAccessProvider>
              </AuthProvider>
            </ConfirmDialogProvider>
            </LocaleProvider>
          </ToastProvider>
        </IconoirProviderRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
