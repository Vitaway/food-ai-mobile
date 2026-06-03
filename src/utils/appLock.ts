import * as SecureStore from 'expo-secure-store';

import { APP_LOCK_ENABLED_KEY, BIOMETRICS_ENABLED_KEY } from '@/constants/storageKeys';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

const PASSCODE_KEY = 'vitaway_app_passcode';

export async function isAppLockEnabled() {
  return getStorageItem(APP_LOCK_ENABLED_KEY, false);
}

export async function setAppLockEnabled(enabled: boolean) {
  await setStorageItem(APP_LOCK_ENABLED_KEY, enabled);
}

export async function savePasscode(pin: string) {
  await SecureStore.setItemAsync(PASSCODE_KEY, pin);
}

export async function verifyPasscode(pin: string) {
  const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
  return stored === pin;
}

export async function hasPasscode() {
  const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
  return Boolean(stored);
}

export async function isBiometricsUnlockEnabled() {
  return getStorageItem(BIOMETRICS_ENABLED_KEY, false);
}

export async function setBiometricsUnlockEnabled(enabled: boolean) {
  await setStorageItem(BIOMETRICS_ENABLED_KEY, enabled);
}

export async function clearPasscode() {
  await SecureStore.deleteItemAsync(PASSCODE_KEY);
  await setAppLockEnabled(false);
  await setBiometricsUnlockEnabled(false);
}
