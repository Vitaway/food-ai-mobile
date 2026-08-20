import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { enteringCard } from '@/components/ui/motion';
import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { useToast } from '@/context/ToastContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { fetchCoachQueue } from '@/services/remote/coachApi';
import type { CoachQueueItem } from '@/types/coach';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { formatDurationFromMinutes, formatRelativeTime } from '@/utils/time';

function QueueCard({ item, index, onPress }: { item: CoachQueueItem; index: number; onPress: () => void }) {
  const name = item.client.profile?.displayName?.trim() || item.client.patientId || 'Patient';
  const mealName = item.meal.mealName?.trim() || item.meal.note?.trim() || item.meal.mealType || 'Meal';
  const waiting = item.meal.waitingMinutes != null
    ? `${formatDurationFromMinutes(item.meal.waitingMinutes)} waiting`
    : formatRelativeTime(item.meal.submittedAt);

  return (
    <Animated.View entering={enteringCard(index)}>
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-3xl bg-white active:opacity-90"
        style={{
          shadowColor: '#1a1c17',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 3,
        }}>
        <View className="flex-row">
          <ResolvedImage
            uri={item.meal.thumbnailUrl ?? item.meal.imageUrl}
            className="h-28 w-28"
            resizeMode="cover"
            fallback={
              <View className="h-28 w-28 items-center justify-center bg-ash-grey-100">
                <Text className="text-3xl">🍽️</Text>
              </View>
            }
          />
          <View className="min-w-0 flex-1 justify-center p-4">
            <Text className="text-xs font-sans-semibold uppercase tracking-wide text-blue-spruce-700">
              {name}
            </Text>
            <Text className="mt-0.5 font-sans-bold text-base text-neutral-900" numberOfLines={2}>
              {mealName}
            </Text>
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-cinnamon-wood-100 px-2.5 py-1">
                <Text className="text-[11px] font-sans-semibold text-cinnamon-wood-700">{waiting}</Text>
              </View>
              {item.meal.queueNeedsPickup ? (
                <View className="rounded-full bg-red-100 px-2.5 py-1">
                  <Text className="text-[11px] font-sans-semibold text-red-700">Needs pickup</Text>
                </View>
              ) : null}
              {item.meal.queueIsPicked && item.meal.queuePickedByCoachName ? (
                <Text className="text-[11px] text-neutral-500" numberOfLines={1}>
                  {item.meal.queuePickedByCoachName}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="justify-center pr-3">
            <Ionicons name="chevron-forward" size={18} color="#848a75" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CoachQueueScreen() {
  const { push } = useNavigateOnce();
  const toast = useToast();
  const { queueVersion } = useCoachQueueRealtime();
  const [items, setItems] = useState<CoachQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const next = await fetchCoachQueue();
      setItems(next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load the review queue.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  useEffect(() => {
    if (!queueVersion) return;
    void load(true);
  }, [load, queueVersion]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <GradientHeaderTitle>Review queue</GradientHeaderTitle>
            <Text className="mt-1 text-sm text-white/80">
              {items.length} meal{items.length === 1 ? '' : 's'} waiting
            </Text>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>
      <ContentSheet className="flex-1 pt-4">
        {loading && items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} />
            }
            contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: 12 }}>
            {items.length === 0 ? (
              <View className="items-center rounded-3xl bg-ash-grey-50 px-6 py-10">
                <Text className="font-sans-semibold text-base text-neutral-900">Queue is clear</Text>
                <Text className="mt-1 text-center text-sm text-neutral-500">
                  New patient meals will appear here instantly, with a notification on this phone.
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <QueueCard
                  key={item.meal.id}
                  item={item}
                  index={index}
                  onPress={() => push(`/coach/meal/${item.meal.id}` as Href)}
                />
              ))
            )}
          </ScrollView>
        )}
      </ContentSheet>
    </View>
  );
}

