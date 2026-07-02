export const STORAGE_KEYS = {
  profile: '@vitaway/profile',
  meals: '@vitaway/meals',
  dailyLogs: '@vitaway/daily_logs',
  notificationReads: '@vitaway/notification_reads',
  notificationSettings: '@vitaway/notification_settings',
} as const;

export const APP_LOCK_ENABLED_KEY = '@vitaway/app_lock_enabled';
export const BIOMETRICS_ENABLED_KEY = '@vitaway/biometrics_enabled';
/** Legacy passcode storage — cleared on account reset for existing installs. */
export const LEGACY_PASSCODE_KEY = 'vitaway_app_passcode';
