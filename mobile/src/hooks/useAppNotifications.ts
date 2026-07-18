import { useCallback, useEffect, useMemo, useState } from 'react';

import { isApiConfigured } from '@/constants/api';
import {
  isAwaitingCoachReview,
  isPipelineActive,
  MEAL_STATUS_MESSAGES,
  MEAL_STATUS_LABELS,
} from '@/constants/mealStatus';
import { useAuth } from '@/context/AuthContext';
import { useNotificationSocket } from '@/context/NotificationContext';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { services } from '@/services';
import { buildLocalNudges } from '@/services/local/nudges';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/services/local/notificationPreferences';
import type { MealSubmission, MealSubmissionStatus } from '@/types';
import { todayKey } from '@/utils/dates';
import { notificationReadKey } from '@/utils/notificationReads';

export type AppNotification = {
  id: string;
  readKey: string;
  serverId?: string;
  mealId?: string;
  title: string;
  message: string;
  status?: MealSubmissionStatus;
  kind: 'meal' | 'nudge' | 'referral' | 'system';
  createdAt: string;
  read: boolean;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function mealNotifications(meals: MealSubmission[], readKeys: Set<string>): AppNotification[] {
  return meals
    .filter(
      (meal) =>
        isPipelineActive(meal.status) ||
        isAwaitingCoachReview(meal.status) ||
        meal.status === 'approved' ||
        meal.status === 'rejected',
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 20)
    .map((meal) => {
      const readKey = notificationReadKey(meal.id, meal.status);
      return {
        id: readKey,
        readKey,
        mealId: meal.id,
        title: meal.mealName ?? 'Your meal',
        message: MEAL_STATUS_MESSAGES[meal.status],
        status: meal.status,
        kind: 'meal' as const,
        createdAt: meal.submittedAt,
        read: readKeys.has(readKey),
      };
    });
}

/** Lightweight badge count for home — no API calls. */
export function useNotificationUnreadCount() {
  const { isAuthenticated } = useAuth();
  const useServer = isApiConfigured() && isAuthenticated;
  const { serverUnreadCount } = useNotificationSocket();
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [waterMl, setWaterMl] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [reads, notificationSettings, log] = await Promise.all([
        services.notificationsRepository.getReadKeys(),
        services.notificationsRepository.getSettings(),
        services.mealsRepository.getDailyLog(todayKey()),
      ]);
      if (cancelled) return;
      setReadKeys(reads);
      setSettings(notificationSettings);
      setWaterMl(log.waterMl);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    if (!profile) {
      return useServer ? serverUnreadCount : 0;
    }

    const nudgeUnread = buildLocalNudges({
      meals,
      waterMl,
      waterTargetMl: profile.waterTargetMl ?? 0,
      settings,
    }).filter((nudge) => !readKeys.has(nudge.readKey)).length;

    if (useServer) {
      return serverUnreadCount + nudgeUnread;
    }

    const mealUnread = mealNotifications(meals, readKeys).filter((item) => !item.read).length;
    return mealUnread + nudgeUnread;
  }, [meals, profile, readKeys, serverUnreadCount, settings, useServer, waterMl]);
}

export function useAppNotifications() {
  const { isAuthenticated } = useAuth();
  const useServer = isApiConfigured() && isAuthenticated;
  const {
    serverNotifications,
    serverUnreadCount,
    refreshServerNotifications,
    markServerRead,
    markAllServerRead,
  } = useNotificationSocket();
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
  const [waterMl, setWaterMl] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const refreshReads = useCallback(async () => {
    setReadKeys(await services.notificationsRepository.getReadKeys());
  }, []);

  const refreshContext = useCallback(
    async (options?: { includeServer?: boolean }) => {
      const [reads, notificationSettings, log] = await Promise.all([
        services.notificationsRepository.getReadKeys(),
        services.notificationsRepository.getSettings(),
        services.mealsRepository.getDailyLog(todayKey()),
      ]);
      setReadKeys(reads);
      setSettings(notificationSettings);
      setWaterMl(log.waterMl);

      if (useServer && options?.includeServer) {
        await refreshServerNotifications(true);
      }
    },
    [refreshServerNotifications, useServer],
  );

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const items = useMemo(() => {
    const waterTarget = profile?.waterTargetMl ?? 0;

    const nudgeItems: AppNotification[] = profile
      ? buildLocalNudges({
          meals,
          waterMl,
          waterTargetMl: waterTarget,
          settings,
        }).map((nudge) => ({
          id: nudge.id,
          readKey: nudge.readKey,
          title: nudge.title,
          message: nudge.message,
          kind: 'nudge' as const,
          createdAt: nudge.createdAt,
          read: readKeys.has(nudge.readKey),
        }))
      : [];

    const serverItems: AppNotification[] = useServer
      ? serverNotifications.map((item) => ({
          id: `server:${item.id}`,
          readKey: `server:${item.id}`,
          serverId: item.id,
          mealId: item.mealId ?? undefined,
          title: item.title,
          message: item.message,
          status: (item.status as MealSubmissionStatus | null) ?? undefined,
          kind: item.kind,
          createdAt: item.createdAt,
          read: item.read,
        }))
      : mealNotifications(meals, readKeys);

    // Real events (reviews, system, referrals) above local nudges when times are close.
    const kindRank = (kind: AppNotification['kind']) => (kind === 'nudge' ? 1 : 0);
    const merged = [...nudgeItems, ...serverItems].sort((a, b) => {
      const byTime = b.createdAt.localeCompare(a.createdAt);
      if (byTime !== 0) return byTime;
      return kindRank(a.kind) - kindRank(b.kind);
    });

    return merged.map((item) => ({
      ...item,
      timeLabel: timeAgo(item.createdAt),
      statusLabel: item.status ? MEAL_STATUS_LABELS[item.status] : undefined,
    }));
  }, [meals, profile, readKeys, settings, serverNotifications, useServer, waterMl]);

  const unreadCount = useMemo(() => {
    const localUnread = items.filter((item) => !item.read && !item.serverId).length;
    if (useServer) {
      return serverUnreadCount + localUnread;
    }
    return items.filter((item) => !item.read).length;
  }, [items, serverUnreadCount, useServer]);

  const markRead = useCallback(
    async (readKey: string) => {
      if (readKey.startsWith('server:')) {
        const serverId = readKey.slice('server:'.length);
        await markServerRead(serverId);
        return;
      }

      await services.notificationsRepository.markRead(readKey);
      setReadKeys((current) => new Set([...current, readKey]));
    },
    [markServerRead],
  );

  const markAllRead = useCallback(async () => {
    const localUnread = items.filter((item) => !item.read && !item.serverId);
    await Promise.all(localUnread.map((item) => services.notificationsRepository.markRead(item.readKey)));

    if (useServer) {
      await markAllServerRead();
    }

    await refreshReads();
  }, [items, markAllServerRead, refreshReads, useServer]);

  const dismiss = markRead;

  return {
    items,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    refreshReads,
    refreshContext,
    settings,
    setSettings,
  };
}
