import { useEffect, useRef } from 'react';

import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { useMeals } from '@/context/MealsContext';
import { useNotificationSocket } from '@/context/NotificationContext';

/** Refresh meals when a live meal notification arrives (after initial hydrate). */
export function NotificationMealSync() {
  const { isAuthenticated } = useAuth();
  const { serverNotifications, hasLoadedNotifications } = useNotificationSocket();
  const { refreshMeals } = useMeals();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated) {
      seenIdsRef.current.clear();
      hydratedRef.current = false;
      return;
    }

    if (!hasLoadedNotifications) return;

    if (!hydratedRef.current) {
      for (const notification of serverNotifications) {
        seenIdsRef.current.add(notification.id);
      }
      hydratedRef.current = true;
      return;
    }

    let shouldRefresh = false;
    for (const notification of serverNotifications) {
      if (seenIdsRef.current.has(notification.id)) continue;
      seenIdsRef.current.add(notification.id);
      if (notification.kind === 'meal') {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh) {
      void refreshMeals().catch(() => undefined);
    }
  }, [hasLoadedNotifications, isAuthenticated, refreshMeals, serverNotifications]);

  return null;
}

/**
 * Forces the coach review queue to refresh when a new "review" push notification arrives.
 * This keeps the coach's "time window" tight even if they came from background push.
 */
export function NotificationCoachQueueSync() {
  const { isAuthenticated, isCoach } = useAuth();
  const { serverNotifications, hasLoadedNotifications } = useNotificationSocket();
  const { bumpQueueVersion } = useCoachQueueRealtime();

  const seenIdsRef = useRef<Set<string>>(new Set());
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isApiConfigured() || !isAuthenticated || !isCoach) {
      seenIdsRef.current.clear();
      hydratedRef.current = false;
      return;
    }

    if (!hasLoadedNotifications) return;

    if (!hydratedRef.current) {
      for (const notification of serverNotifications) {
        seenIdsRef.current.add(notification.id);
      }
      hydratedRef.current = true;
      return;
    }

    let shouldBump = false;
    for (const notification of serverNotifications) {
      if (seenIdsRef.current.has(notification.id)) continue;
      seenIdsRef.current.add(notification.id);
      if (notification.kind === 'review') {
        shouldBump = true;
      }
    }

    if (shouldBump) bumpQueueVersion();
  }, [bumpQueueVersion, hasLoadedNotifications, isAuthenticated, isCoach, serverNotifications]);

  return null;
}
