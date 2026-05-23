import { createContext, useContext, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AppContext = createContext({ ready: true });

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AppContext.Provider value={{ ready: true }}>{children}</AppContext.Provider>
    </SafeAreaProvider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
