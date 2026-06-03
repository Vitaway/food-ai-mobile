import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export function notificationReadKey(mealId: string, status: string) {
  return `${mealId}:${status}`;
}

export async function getReadNotificationKeys(): Promise<Set<string>> {
  const keys = await getStorageItem<string[]>(STORAGE_KEYS.notificationReads, []);
  return new Set(keys);
}

export async function markNotificationRead(key: string) {
  const current = await getReadNotificationKeys();
  if (current.has(key)) return;
  current.add(key);
  await setStorageItem(STORAGE_KEYS.notificationReads, [...current]);
}

export async function clearNotificationReads() {
  await setStorageItem(STORAGE_KEYS.notificationReads, []);
}
