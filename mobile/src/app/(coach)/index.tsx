import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { CoachDashboardStatCard } from '@/components/coach/CoachDashboardStatCard';
import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { enteringCard } from '@/components/ui/motion';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { palette } from '@/design-system/colors';
import { fetchCoachQueue, fetchCoachSmartAlerts, fetchCoachStats } from '@/services/remote/coachApi';
import type { CoachQueueItem, CoachStats, SmartCoachAlert } from '@/types/coach';
import { formatDurationFromMinutes } from '@/utils/time';

function formatWait(minutes: number | null | undefined) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  return formatDurationFromMinutes(Math.max(0, Math.round(minutes)));
}

function alertStyle(severity: SmartCoachAlert['severity']) {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: 'alert-circle' as const };
    case 'warning':
      return { bg: 'bg-cinnamon-wood-50', border: 'border-cinnamon-wood-100', text: 'text-cinnamon-wood-700', icon: 'warning' as const };
    default:
      return { bg: 'bg-blue-spruce-50', border: 'border-blue-spruce-100', text: 'text-blue-spruce-700', icon: 'information-circle' as const };
  }
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { queueVersion } = useCoachQueueRealtime();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [alerts, setAlerts] = useState<SmartCoachAlert[]>([]);
  const [queuePreview, setQueuePreview] = useState<CoachQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStats, nextAlerts, queue] = await Promise.all([
        fetchCoachStats(),
        fetchCoachSmartAlerts(),
        fetchCoachQueue(),
      ]);
      setStats(nextStats);
      setAlerts(nextAlerts.slice(0, 4));
      setQueuePreview(queue.slice(0, 4));
    } catch {
      setStats(null);
      setAlerts([]);
      setQueuePreview([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, queueVersion]),
  );

  const displayName = session?.user.displayName?.trim() || 'Coach';
  const firstName = displayName.split(/\s+/)[0] || 'Coach';

  const reviewProgress = useMemo(() => {
    const inReview = stats?.inReview ?? 0;
    const approvedToday = stats?.approvedToday ?? 0;
    const total = inReview + approvedToday;
    if (total === 0) return { pct: 0, label: 'All caught up!' };
    const pct = Math.round((approvedToday / total) * 100);
    return {
      pct,
      label: pct >= 70 ? 'You are on track!' : pct >= 40 ? 'Keep the momentum going' : 'Queue needs attention',
    };
  }, [stats]);

  const heroValue = stats?.inReview ?? 0;
  const heroLabel = heroValue === 1 ? 'meal waiting for review' : 'meals waiting for review';

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <GradientHeader style={{ paddingBottom: 64 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center gap-3 pr-3">
            <View className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/30">
              <ResolvedImage
                uri={session?.user.avatarUrl ?? undefined}
                className="h-full w-full"
                resizeMode="cover"
                fallback={
                  <View className="h-full w-full items-center justify-center bg-shamrock-500">
                    <Text className="font-sans-semibold text-sm text-white">{firstName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                }
              />
            </View>
            <View className="flex-1">
              <GradientHeaderTitle>Dashboard</GradientHeaderTitle>
              <Text className="mt-0.5 text-sm text-white/80">Hi, {firstName}</Text>
            </View>
          </View>
          <CoachHeaderActions />
        </View>

        <View className="mt-8">
          <Text className="font-sans-bold text-4xl text-white">{heroValue}</Text>
          <Text className="mt-1 text-base text-white/85">{heroLabel}</Text>
          {stats?.avgReviewMinutes != null ? (
            <View className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-white/15 px-3 py-1.5">
              <Ionicons name="time-outline" size={14} color="#ffffff" />
              <Text className="text-xs font-sans-semibold text-white/90">
                Avg wait {formatWait(stats.avgReviewMinutes)}
              </Text>
            </View>
          ) : null}
        </View>
      </GradientHeader>

      <ContentSheet className="-mt-10 pt-0" style={{ backgroundColor: palette['ash-grey'][50] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-5 pt-5">
          {/* Stat cards row */}
          <Animated.View entering={enteringCard(0)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 px-5">
              <CoachDashboardStatCard
                label="Flagged"
                value={String(stats?.flagged ?? 0)}
                icon="flag-outline"
                iconBg={palette['blue-spruce'][50]}
                iconColor={palette['blue-spruce'][600]}
                onPress={() => router.push('/(coach)/queue')}
              />
              <CoachDashboardStatCard
                label="In review"
                value={String(stats?.inReview ?? 0)}
                icon="restaurant-outline"
                iconBg={palette['cinnamon-wood'][50]}
                iconColor={palette['cinnamon-wood'][500]}
                onPress={() => router.push('/(coach)/queue')}
              />
              <CoachDashboardStatCard
                label="Approved today"
                value={String(stats?.approvedToday ?? 0)}
                trend={stats?.approvedToday ? '+today' : undefined}
                trendUp
                icon="checkmark-circle-outline"
                iconBg={palette.shamrock[50]}
                iconColor={palette.shamrock[600]}
              />
              <CoachDashboardStatCard
                label="Waiting 1hr+"
                value={String(stats?.waitingOverHour ?? 0)}
                icon="alert-circle-outline"
                iconBg={palette['cinnamon-wood'][50]}
                iconColor={palette['cinnamon-wood'][600]}
              />
              <CoachDashboardStatCard
                label="Avg wait"
                value={formatWait(stats?.avgReviewMinutes)}
                icon="hourglass-outline"
                iconBg={palette['muted-teal'][50]}
                iconColor={palette['muted-teal'][600]}
              />
            </ScrollView>
          </Animated.View>

          {/* Review overview card */}
          <Animated.View entering={enteringCard(1)} className="px-5">
            <View
              className="rounded-3xl bg-white p-5"
              style={{
                shadowColor: '#1a1c17',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.07,
                shadowRadius: 18,
                elevation: 3,
              }}>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-semibold text-base text-neutral-900">Review overview</Text>
                <Pressable onPress={() => router.push('/(coach)/queue')}>
                  <Text className="text-sm font-sans-semibold text-blue-spruce-600">Open queue</Text>
                </Pressable>
              </View>

              <View className="mt-4 flex-row justify-between">
                <View>
                  <Text className="text-xs text-neutral-500">In queue</Text>
                  <Text className="mt-0.5 font-sans-bold text-lg text-neutral-900">{stats?.inReview ?? 0}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-neutral-500">Approved</Text>
                  <Text className="mt-0.5 font-sans-bold text-lg text-shamrock-600">{stats?.approvedToday ?? 0}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-neutral-500">Avg wait</Text>
                  <Text className="mt-0.5 font-sans-bold text-lg text-neutral-900">
                    {formatWait(stats?.avgReviewMinutes)}
                  </Text>
                </View>
              </View>

              <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-ash-grey-100">
                <View
                  className="h-full rounded-full bg-blue-spruce-500"
                  style={{ width: `${Math.max(reviewProgress.pct, 4)}%` }}
                />
              </View>
              <Text className="mt-2 text-sm text-neutral-500">{reviewProgress.label}</Text>
            </View>
          </Animated.View>

          {/* Smart alerts */}
          {alerts.length > 0 ? (
            <Animated.View entering={enteringCard(2)} className="px-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-sans-semibold text-base text-neutral-900">Smart alerts</Text>
              </View>
              <View className="gap-2">
                {alerts.map((alert) => {
                  const style = alertStyle(alert.severity);
                  return (
                    <Pressable
                      key={alert.id}
                      onPress={() => {
                        if (alert.clientId) router.push(`/coach/client/${alert.clientId}`);
                      }}
                      className={`flex-row items-start gap-3 rounded-2xl border p-4 ${style.bg} ${style.border}`}>
                      <Ionicons name={style.icon} size={20} color={palette['blue-spruce'][700]} />
                      <View className="flex-1">
                        <Text className={`font-sans-semibold text-sm ${style.text}`}>{alert.clientName}</Text>
                        <Text className="mt-0.5 text-xs leading-5 text-neutral-600">{alert.message}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={palette['ash-grey'][400]} />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}

          {/* Queue preview */}
          <Animated.View entering={enteringCard(3)} className="px-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-sans-semibold text-base text-neutral-900">Latest in queue</Text>
              <Pressable onPress={() => router.push('/(coach)/queue')}>
                <Text className="text-sm font-sans-semibold text-blue-spruce-600">Show all</Text>
              </Pressable>
            </View>

            <View
              className="overflow-hidden rounded-3xl bg-white"
              style={{
                shadowColor: '#1a1c17',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 14,
                elevation: 2,
              }}>
              {loading && queuePreview.length === 0 ? (
                <View className="items-center py-10">
                  <Text className="text-sm text-neutral-500">Loading queue…</Text>
                </View>
              ) : queuePreview.length === 0 ? (
                <View className="items-center px-6 py-10">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-shamrock-50">
                    <Ionicons name="checkmark-done" size={28} color={palette.shamrock[600]} />
                  </View>
                  <Text className="mt-3 font-sans-semibold text-base text-neutral-900">Queue is clear</Text>
                  <Text className="mt-1 text-center text-sm text-neutral-500">
                    New meal submissions will appear here for review.
                  </Text>
                </View>
              ) : (
                queuePreview.map((item, index) => {
                  const clientName =
                    item.client.profile?.displayName?.trim() || item.client.patientId || 'Patient';
                  const mealName =
                    item.meal.mealName?.trim() || item.meal.note?.trim() || item.meal.mealType || 'Meal';
                  const waiting = formatWait(item.meal.waitingMinutes);
                  return (
                    <View key={item.meal.id}>
                      {index > 0 ? <View className="mx-4 h-px bg-ash-grey-100" /> : null}
                      <Pressable
                        onPress={() => router.push(`/coach/meal/${item.meal.id}`)}
                        className="flex-row items-center gap-3 px-4 py-4 active:bg-ash-grey-50">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-cinnamon-wood-50">
                          <Ionicons name="restaurant" size={20} color={palette['cinnamon-wood'][500]} />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text className="font-sans-semibold text-sm text-neutral-900" numberOfLines={1}>
                            {clientName}
                          </Text>
                          <Text className="mt-0.5 text-xs text-neutral-500" numberOfLines={1}>
                            {mealName} · {waiting} waiting
                          </Text>
                        </View>
                        {item.meal.queueNeedsPickup ? (
                          <View className="rounded-full bg-red-50 px-2.5 py-1">
                            <Text className="text-[10px] font-sans-semibold text-red-600">Pickup</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* Quick tools */}
          <Animated.View entering={enteringCard(4)} className="px-5">
            <Text className="mb-3 font-sans-semibold text-base text-neutral-900">Quick tools</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push('/coach/nutrition-db')}
                className="flex-1 flex-row items-center gap-3 rounded-2xl bg-white p-4 active:opacity-90"
                style={{
                  shadowColor: '#1a1c17',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 1,
                }}>
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-spruce-50">
                  <Ionicons name="search" size={20} color={palette['blue-spruce'][600]} />
                </View>
                <Text className="flex-1 font-sans-semibold text-sm text-neutral-900">Nutrition DB</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(coach)/clients')}
                className="flex-1 flex-row items-center gap-3 rounded-2xl bg-white p-4 active:opacity-90"
                style={{
                  shadowColor: '#1a1c17',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 1,
                }}>
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-shamrock-50">
                  <Ionicons name="people" size={20} color={palette.shamrock[600]} />
                </View>
                <Text className="flex-1 font-sans-semibold text-sm text-neutral-900">Clients</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
