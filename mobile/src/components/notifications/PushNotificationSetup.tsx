import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useOptionalNotificationSocket } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';
import { claimIncomingToast } from '@/services/local/incomingNotificationToasts';
import { isExpoNotificationsAvailable, loadExpoNotifications } from '@/services/push/expoNotifications';
import {
  clearPushTokenFromServer,
  syncPushTokenWithServer,
} from '@/services/push/pushNotifications';

function navigateFromNotificationData(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown>,
) {
  const conversationId = typeof data.conversationId === 'string' ? data.conversationId : null;
  const mealId = typeof data.mealId === 'string' ? data.mealId : null;
  const kind = typeof data.kind === 'string' ? data.kind : null;

  if (conversationId) {
    router.push(`/chat/${conversationId}`);
    return;
  }
  if (mealId) {
    router.push(`/meal/${mealId}`);
    return;
  }
  if (kind === 'referral') {
    router.push('/referral');
    return;
  }
  router.push('/notifications');
}

/** Registers device for Expo push + handles taps while app is open/backgrounded. */
export function PushNotificationSetup() {
  const router = useRouter();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { isAuthenticated } = useAuth();
  const notificationSocket = useOptionalNotificationSocket();

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated) {
      void clearPushTokenFromServer();
      return;
    }

    if (!isExpoNotificationsAvailable()) return;

    void (async () => {
      const Notifications = await loadExpoNotifications();
      if (!Notifications) return;
      const settings = await Notifications.getPermissionsAsync();
      const granted =
        settings.granted ||
        settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      // Only sync when already allowed — first-install prompt owns the system dialog.
      if (granted) {
        await syncPushTokenWithServer();
      }
    })();

    let subscription: { remove: () => void } | undefined;

    void loadExpoNotifications().then((Notifications) => {
      if (!Notifications) return;
      subscription = Notifications.addPushTokenListener(() => {
        void syncPushTokenWithServer();
      });
    });

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !isExpoNotificationsAvailable()) return;

    let received: { remove: () => void } | undefined;
    let response: { remove: () => void } | undefined;
    let cancelled = false;

    void loadExpoNotifications().then((Notifications) => {
      if (!Notifications || cancelled) return;

      void Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
        if (!lastResponse) return;
        const data = (lastResponse.notification.request.content.data ?? {}) as Record<string, unknown>;
        navigateFromNotificationData(router, data);
      });

      received = Notifications.addNotificationReceivedListener((notification) => {
        const title = notification.request.content.title ?? 'MiraFood';
        const body = notification.request.content.body ?? '';
        const data = (notification.request.content.data ?? {}) as Record<string, unknown>;
        const notificationId =
          typeof data.notificationId === 'string'
            ? data.notificationId
            : typeof data.id === 'string'
              ? data.id
              : null;

        if (body) {
          const claimId = notificationId ?? `push:${title}:${body}`;
          if (claimIncomingToast(claimId)) {
            toastRef.current.incoming(body, title, 'info');
          }
        }
        void notificationSocket?.refreshServerNotifications(true);
      });

      response = Notifications.addNotificationResponseReceivedListener((event) => {
        const data = (event.notification.request.content.data ?? {}) as Record<string, unknown>;
        navigateFromNotificationData(router, data);
      });
    });

    return () => {
      cancelled = true;
      received?.remove();
      response?.remove();
    };
  }, [isAuthenticated, notificationSocket, router]);

  return null;
}
