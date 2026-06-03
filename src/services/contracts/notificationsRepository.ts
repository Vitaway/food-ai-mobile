import type { NotificationCategory, NotificationSettings } from '@/services/local/notificationPreferences';

export type { NotificationCategory, NotificationSettings };

export interface NotificationsRepository {
  getReadKeys: () => Promise<Set<string>>;
  markRead: (key: string) => Promise<void>;
  clearReads: () => Promise<void>;
  getSettings: () => Promise<NotificationSettings>;
  saveSettings: (settings: NotificationSettings) => Promise<void>;
}
