import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { enteringCard } from '@/components/ui/motion';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { palette } from '@/design-system/colors';
import { fetchCoachQueue, fetchCoachSmartAlerts, fetchCoachStats } from '@/services/remote/coachApi';
import type { CoachQueueItem, CoachStats, SmartCoachAlert } from '@/types/coach';
import { formatDurationFromMinutes } from '@/utils/time';

const SURFACE = '#F3F6F8';

function formatWait(minutes: number | null | undefined) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  return formatDurationFromMinutes(Math.max(0, Math.round(minutes)));
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { queueVersion } = useCoachQueueRealtime();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [alerts, setAlerts] = useState<SmartCoachAlert[]>([]);
  const [queuePreview, setQueuePreview] = useState<CoachQueueItem[]>([]);

  const load = useCallback(async () => {
    try {
      const [nextStats, nextAlerts, queue] = await Promise.all([
        fetchCoachStats(),
        fetchCoachSmartAlerts(),
        fetchCoachQueue(),
      ]);
      setStats(nextStats);
      setAlerts(nextAlerts.slice(0, 2));
      setQueuePreview(queue.slice(0, 3));
    } catch {
      setStats(null);
      setAlerts([]);
      setQueuePreview([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, queueVersion]),
  );

  const displayName = session?.user.displayName?.trim() || 'Coach';
  const firstName = displayName.split(/\s+/)[0] || 'Coach';
  const waiting = stats?.inReview ?? 0;

  return (
    <View className="flex-1" style={{ backgroundColor: SURFACE }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
        }}>
        <Animated.View entering={enteringCard(0)} className="px-5">
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
              <View
                className="h-12 w-12 overflow-hidden rounded-full border-[3px] border-white"
                style={{
                  shadowColor: '#023459',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                }}>
                <ResolvedImage
                  uri={session?.user.avatarUrl ?? undefined}
                  className="h-full w-full"
                  resizeMode="cover"
                  fallback={
                    <View className="h-full w-full items-center justify-center bg-blue-spruce-600">
                      <Text className="font-sans-bold text-base text-white">
                        {firstName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  }
                />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-[26px] text-blue-spruce-900">
                  Hey, {firstName}
                </Text>
                <Text className="mt-0.5 text-sm text-ash-grey-500">Your coaching home</Text>
              </View>
            </View>
            <CoachHeaderActions onDark={false} />
          </View>
        </Animated.View>

        {/* Hero — queue count + open action first */}
        <Animated.View entering={enteringCard(1)} className="mt-6 px-5">
          <Pressable
            onPress={() => router.push('/(coach)/queue')}
            className="overflow-hidden rounded-[32px] active:opacity-95"
            style={{
              backgroundColor: palette['blue-spruce'][700],
              shadowColor: palette['blue-spruce'][900],
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.26,
              shadowRadius: 24,
              elevation: 7,
            }}>
            <View
              pointerEvents="none"
              className="absolute -right-8 -top-10 h-36 w-36 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            />

            <View className="px-6 pt-6">
              <Text className="text-[13px] font-sans-semibold uppercase tracking-[0.12em] text-white/55">
                Needs your review
              </Text>

              <View className="mt-3 flex-row items-end justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-bold text-[64px] leading-[68px] text-white">
                    {waiting}
                  </Text>
                  <Text className="mt-1 text-[16px] text-white/85">
                    {waiting === 1 ? 'meal in queue' : 'meals in queue'}
                  </Text>
                </View>

                <View className="mb-2 rounded-full bg-white px-5 py-3.5">
                  <Text className="text-[15px] font-sans-bold text-blue-spruce-800">Open queue</Text>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row border-t border-white/10 px-2 py-4">
              <View className="flex-1 items-center px-2">
                <Text className="text-[11px] text-white/50">Avg wait</Text>
                <Text className="mt-1 text-center text-sm font-sans-bold text-white">
                  {formatWait(stats?.avgReviewMinutes)}
                </Text>
              </View>
              <View className="w-px self-stretch bg-white/10" />
              <View className="flex-1 items-center px-2">
                <Text className="text-[11px] text-white/50">Approved</Text>
                <Text className="mt-1 text-center text-sm font-sans-bold text-white">
                  {stats?.approvedToday ?? 0}
                </Text>
              </View>
              <View className="w-px self-stretch bg-white/10" />
              <View className="flex-1 items-center px-2">
                <Text className="text-[11px] text-white/50">Flagged</Text>
                <Text className="mt-1 text-center text-sm font-sans-bold text-white">
                  {stats?.flagged ?? 0}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {alerts.length > 0 ? (
          <Animated.View entering={enteringCard(2)} className="mt-6 px-5">
            <Text className="mb-3 text-center font-sans-bold text-base text-blue-spruce-900">
              Alerts
            </Text>
            <View className="gap-3">
              {alerts.map((alert) => (
                <Pressable
                  key={alert.id}
                  onPress={() => {
                    if (alert.clientId) router.push(`/coach/client/${alert.clientId}`);
                  }}
                  className="items-center rounded-[24px] bg-white px-5 py-4 active:opacity-90"
                  style={{
                    shadowColor: '#023459',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.04,
                    shadowRadius: 12,
                    elevation: 1,
                  }}>
                  <Text className="text-center font-sans-bold text-[15px] text-blue-spruce-900">
                    {alert.clientName}
                  </Text>
                  <Text
                    className="mt-1 text-center text-sm leading-5 text-ash-grey-600"
                    numberOfLines={2}>
                    {alert.message}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={enteringCard(3)} className="mt-6 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-sans-bold text-base text-blue-spruce-900">Next up</Text>
            <Pressable onPress={() => router.push('/(coach)/queue')}>
              <Text className="text-sm font-sans-semibold text-blue-spruce-600">See all</Text>
            </Pressable>
          </View>

          <View
            className="overflow-hidden rounded-[26px] bg-white"
            style={{
              shadowColor: '#023459',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 16,
              elevation: 2,
            }}>
            {queuePreview.length === 0 ? (
              <View className="px-5 py-8">
                <Text className="font-sans-bold text-[15px] text-blue-spruce-900">Queue is clear</Text>
                <Text className="mt-1 text-sm text-ash-grey-500">New meals will show up here.</Text>
              </View>
            ) : (
              queuePreview.map((item, index) => {
                const clientName =
                  item.client.profile?.displayName?.trim() || item.client.patientId || 'Patient';
                const mealName =
                  item.meal.mealName?.trim() || item.meal.note?.trim() || item.meal.mealType || 'Meal';
                return (
                  <View key={item.meal.id}>
                    {index > 0 ? <View className="mx-4 h-px bg-ash-grey-100" /> : null}
                    <Pressable
                      onPress={() => router.push(`/coach/meal/${item.meal.id}`)}
                      className="px-4 py-4 active:bg-ash-grey-50">
                      <Text
                        className="font-sans-bold text-[15px] text-blue-spruce-900"
                        numberOfLines={1}>
                        {clientName}
                      </Text>
                      <Text className="mt-0.5 text-sm text-ash-grey-500" numberOfLines={1}>
                        {mealName} · {formatWait(item.meal.waitingMinutes)}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
