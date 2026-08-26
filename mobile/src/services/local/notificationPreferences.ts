import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export type NotificationCategory = 'meals' | 'hydration' | 'streak';

export type NotificationSettings = {
  categories: Record<NotificationCategory, boolean>;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  categories: {
    meals: true,
    hydration: true,
    streak: true,
  },
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const stored = await getStorageItem<Partial<NotificationSettings> | null>(
    STORAGE_KEYS.notificationSettings,
    null,
  );
  if (!stored) return DEFAULT_NOTIFICATION_SETTINGS;
  return {
    categories: {
      ...DEFAULT_NOTIFICATION_SETTINGS.categories,
      ...stored.categories,
    },
  };
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  await setStorageItem(STORAGE_KEYS.notificationSettings, settings);
}
