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
    // Foreground only: system banner is suppressed so our in-app banner owns the UX.
    // Background / killed: the OS still shows the push notification normally.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowAlert: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
  });
}
