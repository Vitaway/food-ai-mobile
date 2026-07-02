import { useEffect, useRef } from 'react';

import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
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
      void refreshMeals();
    }
  }, [hasLoadedNotifications, isAuthenticated, refreshMeals, serverNotifications]);

  return null;
}
