import { requireOptionalNativeModule } from 'expo-modules-core';

export function isExpoNotificationsAvailable() {
  return Boolean(requireOptionalNativeModule('ExpoNotifications'));
}

export async function loadExpoNotifications() {
  if (!isExpoNotificationsAvailable()) return null;
  return import('expo-notifications');
}

export function configureNotificationHandler() {
  if (!isExpoNotificationsAvailable()) return;

  void import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  });
}
