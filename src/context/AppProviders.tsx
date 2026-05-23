import { ProfileProvider } from '@/context/ProfileContext';
import { MealsProvider } from '@/context/MealsContext';
import { IconoirProviderRoot } from '@/components/ui/IconoirIcon';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AppContext = createContext({ ready: true });

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <IconoirProviderRoot>
        <ProfileProvider>
          <MealsProvider>
            <AppContext.Provider value={{ ready: true }}>{children}</AppContext.Provider>
          </MealsProvider>
        </ProfileProvider>
      </IconoirProviderRoot>
    </SafeAreaProvider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
