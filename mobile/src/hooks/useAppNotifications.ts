import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isPipelineActive, MEAL_STATUS_MESSAGES, MEAL_STATUS_LABELS } from '@/constants/mealStatus';
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
  mealId?: string;
  title: string;
  message: string;
  status?: MealSubmissionStatus;
  kind: 'meal' | 'nudge';
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
    .filter((meal) => isPipelineActive(meal.status) || meal.status === 'approved' || meal.status === 'rejected')
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

export function useAppNotifications() {
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
  const [waterMl, setWaterMl] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const refreshReads = useCallback(async () => {
    setReadKeys(await services.notificationsRepository.getReadKeys());
  }, []);

  const refreshContext = useCallback(async () => {
    const [reads, notificationSettings, log] = await Promise.all([
      services.notificationsRepository.getReadKeys(),
      services.notificationsRepository.getSettings(),
      services.mealsRepository.getDailyLog(todayKey()),
    ]);
    setReadKeys(reads);
    setSettings(notificationSettings);
    setWaterMl(log.waterMl);
  }, []);

  useEffect(() => {
    refreshContext();
  }, [meals, refreshContext]);

  useFocusEffect(
    useCallback(() => {
      refreshContext();
    }, [refreshContext]),
  );

  const items = useMemo(() => {
    const mealItems = mealNotifications(meals, readKeys);
    const waterTarget = profile?.waterTargetMl ?? 2450;

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

    const merged = [...nudgeItems, ...mealItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return merged.map((item) => ({
      ...item,
      timeLabel: timeAgo(item.createdAt),
      statusLabel: item.status ? MEAL_STATUS_LABELS[item.status] : undefined,
    }));
  }, [meals, profile, readKeys, settings, waterMl]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const markRead = useCallback(async (readKey: string) => {
    await services.notificationsRepository.markRead(readKey);
    setReadKeys((current) => new Set([...current, readKey]));
  }, []);

  const markAllRead = useCallback(async () => {
    await Promise.all(
      items.filter((item) => !item.read).map((item) => services.notificationsRepository.markRead(item.readKey)),
    );
    await refreshReads();
  }, [items, refreshReads]);

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
