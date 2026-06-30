import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export type NotificationCategory = 'meals' | 'hydration' | 'streak';

export type NotificationSettings = {
  quietHoursStart: number;
  quietHoursEnd: number;
  categories: Record<NotificationCategory, boolean>;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  quietHoursStart: 22,
  quietHoursEnd: 7,
  categories: {
    meals: true,
    hydration: true,
    streak: true,
  },
};

export function isQuietHours(settings: NotificationSettings, date = new Date()) {
  const hour = date.getHours();
  const { quietHoursStart: start, quietHoursEnd: end } = settings;
  if (start === end) return false;
  if (start > end) return hour >= start || hour < end;
  return hour >= start && hour < end;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return getStorageItem(STORAGE_KEYS.notificationSettings, DEFAULT_NOTIFICATION_SETTINGS);
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  await setStorageItem(STORAGE_KEYS.notificationSettings, settings);
}
