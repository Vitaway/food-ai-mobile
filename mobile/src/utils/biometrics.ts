import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { BIOMETRICS_ENABLED_KEY } from '@/constants/storageKeys';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

const CREDS_KEY = 'mirafood-biometric-creds';

export type BiometricKind = 'face' | 'fingerprint' | 'none';

export type StoredBiometricCreds = {
  email: string;
  password: string;
};

export async function getBiometricKind(): Promise<BiometricKind> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return 'none';
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return types.length ? 'fingerprint' : 'none';
  } catch {
    return 'none';
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  return getStorageItem<boolean>(BIOMETRICS_ENABLED_KEY, false);
}

export async function getStoredBiometricCreds(): Promise<StoredBiometricCreds | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBiometricCreds;
    if (!parsed.email?.trim() || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function enableBiometricLogin(creds: StoredBiometricCreds): Promise<boolean> {
  const kind = await getBiometricKind();
  if (kind === 'none') return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Enable biometric sign-in',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
  });
  if (!result.success) return false;
  await SecureStore.setItemAsync(
    CREDS_KEY,
    JSON.stringify({ email: creds.email.trim().toLowerCase(), password: creds.password }),
  );
  await setStorageItem(BIOMETRICS_ENABLED_KEY, true);
  return true;
}

export async function disableBiometricLogin(): Promise<void> {
  await removeStorageItem(BIOMETRICS_ENABLED_KEY);
  await SecureStore.deleteItemAsync(CREDS_KEY);
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<StoredBiometricCreds | null> {
  const enabled = await isBiometricsEnabled();
  const creds = await getStoredBiometricCreds();
  if (!enabled || !creds) return null;
  const kind = await getBiometricKind();
  if (kind === 'none') return null;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
  });
  if (!result.success) return null;
  return creds;
}
