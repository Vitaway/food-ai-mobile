import type { NotificationsRepository } from '@/services/contracts/notificationsRepository';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '@/services/local/notificationPreferences';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getStorageItem, setStorageItem } from '@/utils/storage';

async function getReadNotificationKeys(): Promise<Set<string>> {
  const keys = await getStorageItem<string[]>(STORAGE_KEYS.notificationReads, []);
  return new Set(keys);
}

export const localNotificationsRepository: NotificationsRepository = {
  getReadKeys: getReadNotificationKeys,
  markRead: async (key) => {
    const current = await getReadNotificationKeys();
    if (current.has(key)) return;
    current.add(key);
    await setStorageItem(STORAGE_KEYS.notificationReads, [...current]);
  },
  clearReads: async () => {
    await setStorageItem(STORAGE_KEYS.notificationReads, []);
  },
  getSettings: getNotificationSettings,
  saveSettings: saveNotificationSettings,
};
