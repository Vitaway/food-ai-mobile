import { AppLockProvider } from '@/context/AppLockContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { MealsProvider } from '@/context/MealsContext';
import { AppLockOverlay } from '@/components/security/AppLockOverlay';
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
          <AppLockProvider>
            <ProfileProvider>
              <MealsProvider>
                <AppContext.Provider value={{ ready: true }}>
                  {children}
                  <AppLockOverlay />
                </AppContext.Provider>
              </MealsProvider>
            </ProfileProvider>
          </AppLockProvider>
        </IconoirProviderRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
