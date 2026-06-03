import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { authenticateWithBiometrics, getBiometricSupport } from '@/utils/biometrics';
import {
  clearPasscode,
  hasPasscode,
  isAppLockEnabled,
  isBiometricsUnlockEnabled,
  savePasscode,
  setAppLockEnabled,
  setBiometricsUnlockEnabled,
  verifyPasscode as checkStoredPasscode,
} from '@/utils/appLock';

type AppLockContextValue = {
  isReady: boolean;
  isEnabled: boolean;
  isLocked: boolean;
  biometricsEnabled: boolean;
  biometricsAvailable: boolean;
  biometricLabel: string;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  verifyPasscode: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  enableLock: (pin: string) => Promise<void>;
  disableLock: (pin: string) => Promise<boolean>;
  changePasscode: (currentPin: string, newPin: string) => Promise<boolean>;
  setBiometricsEnabled: (enabled: boolean) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');
  const appState = useRef(AppState.currentState);

  const hydrate = useCallback(async () => {
    const [enabled, stored, bioEnabled, bioSupport] = await Promise.all([
      isAppLockEnabled(),
      hasPasscode(),
      isBiometricsUnlockEnabled(),
      getBiometricSupport(),
    ]);
    const active = enabled && stored;
    setIsEnabled(active);
    setIsLocked(active);
    setBiometricsEnabledState(active && bioEnabled && bioSupport.available);
    setBiometricsAvailable(bioSupport.available);
    setBiometricLabel(bioSupport.label);
    setIsReady(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onChange = (nextState: AppStateStatus) => {
      const wasBackground =
        appState.current === 'background' || appState.current === 'inactive';
      if (wasBackground && nextState === 'active' && isEnabled) {
        setIsLocked(true);
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [isEnabled]);

  const lock = useCallback(() => {
    if (isEnabled) setIsLocked(true);
  }, [isEnabled]);

  const verifyPasscodePin = useCallback((pin: string) => checkStoredPasscode(pin), []);

  const unlock = useCallback(async (pin: string) => {
    const valid = await verifyPasscodePin(pin);
    if (valid) setIsLocked(false);
    return valid;
  }, [verifyPasscodePin]);

  const unlockWithBiometrics = useCallback(async () => {
    if (!biometricsEnabled) return false;
    const success = await authenticateWithBiometrics(`Unlock ${biometricLabel}`);
    if (success) setIsLocked(false);
    return success;
  }, [biometricLabel, biometricsEnabled]);

  const enableLock = useCallback(async (pin: string) => {
    await savePasscode(pin);
    await setAppLockEnabled(true);
    setIsEnabled(true);
    setIsLocked(false);
  }, []);

  const disableLock = useCallback(async (pin: string) => {
    const valid = await verifyPasscodePin(pin);
    if (!valid) return false;
    await clearPasscode();
    setIsEnabled(false);
    setIsLocked(false);
    setBiometricsEnabledState(false);
    return true;
  }, [verifyPasscodePin]);

  const changePasscode = useCallback(async (currentPin: string, newPin: string) => {
    const valid = await verifyPasscodePin(currentPin);
    if (!valid) return false;
    await savePasscode(newPin);
    return true;
  }, [verifyPasscodePin]);

  const setBiometricsEnabled = useCallback(
    async (enabled: boolean) => {
      if (!isEnabled) return false;

      if (enabled) {
        const success = await authenticateWithBiometrics(`Enable ${biometricLabel}`);
        if (!success) return false;
        await setBiometricsUnlockEnabled(true);
        setBiometricsEnabledState(true);
        return true;
      }

      await setBiometricsUnlockEnabled(false);
      setBiometricsEnabledState(false);
      return true;
    },
    [biometricLabel, isEnabled],
  );

  const value = useMemo(
    () => ({
      isReady,
      isEnabled,
      isLocked,
      biometricsEnabled,
      biometricsAvailable,
      biometricLabel,
      lock,
      unlock,
      verifyPasscode: verifyPasscodePin,
      unlockWithBiometrics,
      enableLock,
      disableLock,
      changePasscode,
      setBiometricsEnabled,
      refreshSettings: hydrate,
    }),
    [
      isReady,
      isEnabled,
      isLocked,
      biometricsEnabled,
      biometricsAvailable,
      biometricLabel,
      lock,
      unlock,
      verifyPasscodePin,
      unlockWithBiometrics,
      enableLock,
      disableLock,
      changePasscode,
      setBiometricsEnabled,
      hydrate,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) throw new Error('useAppLock must be used within AppLockProvider');
  return context;
}
