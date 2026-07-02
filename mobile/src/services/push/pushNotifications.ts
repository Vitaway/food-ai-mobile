import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { isApiConfigured } from '@/constants/api';
import {
  isExpoNotificationsAvailable,
  loadExpoNotifications,
} from '@/services/push/expoNotifications';
import {
  registerPushToken,
  unregisterPushToken,
} from '@/services/remote/consumerApi';

let activePushToken: string | null = null;

export function getActivePushToken() {
  return activePushToken;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  const Notifications = await loadExpoNotifications();
  if (!Notifications) return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'MiraFood',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#16304D',
    sound: 'default',
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice || !isExpoNotificationsAvailable()) return false;

  const Notifications = await loadExpoNotifications();
  if (!Notifications) return false;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function obtainExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice || !isExpoNotificationsAvailable()) return null;

  const Notifications = await loadExpoNotifications();
  if (!Notifications) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('Expo projectId missing — cannot register for push notifications.');
    return null;
  }

  const granted = await requestPushPermissions();
  if (!granted) return null;

  await ensureAndroidNotificationChannel();

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function syncPushTokenWithServer(): Promise<string | null> {
  if (!isApiConfigured()) return null;

  const token = await obtainExpoPushToken();
  if (!token) return null;

  const platform =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  await registerPushToken(token, platform);
  activePushToken = token;
  return token;
}

export async function clearPushTokenFromServer() {
  if (!isApiConfigured() || !activePushToken) return;

  try {
    await unregisterPushToken(activePushToken);
  } catch {
    /* best effort */
  } finally {
    activePushToken = null;
  }
}
