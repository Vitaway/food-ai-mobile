import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { enteringCard } from '@/components/ui/motion';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { useToast } from '@/context/ToastContext';
import { palette } from '@/design-system/colors';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { fetchCoachQueue } from '@/services/remote/coachApi';
import type { CoachQueueItem } from '@/types/coach';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { formatDurationFromMinutes, formatRelativeTime } from '@/utils/time';

function waitLabel(item: CoachQueueItem) {
  if (item.meal.waitingMinutes != null) {
    return formatDurationFromMinutes(item.meal.waitingMinutes);
  }
  return formatRelativeTime(item.meal.submittedAt);
}

function waitTone(minutes: number | null | undefined) {
  if (minutes == null) return { bg: palette['blue-spruce'][50], text: palette['blue-spruce'][700] };
  if (minutes >= 60) return { bg: '#FEE2E2', text: '#B91C1C' };
  if (minutes >= 30) return { bg: palette['cinnamon-wood'][100], text: palette['cinnamon-wood'][700] };
  return { bg: palette.shamrock[50], text: palette.shamrock[700] };
}

function QueueCard({
  item,
  index,
  onPress,
}: {
  item: CoachQueueItem;
  index: number;
  onPress: () => void;
}) {
  const name = item.client.profile?.displayName?.trim() || item.client.patientId || 'Patient';
  const mealName = item.meal.mealName?.trim() || item.meal.note?.trim() || item.meal.mealType || 'Meal';
  const mealType = (item.meal.mealType || '').trim();
  const waiting = waitLabel(item);
  const tone = waitTone(item.meal.waitingMinutes);
  const needsPickup = Boolean(item.meal.queueNeedsPickup);
  const pickedBy = item.meal.queueIsPicked ? item.meal.queuePickedByCoachName?.trim() : null;

  return (
    <Animated.View entering={enteringCard(index)}>
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-[28px] bg-white active:opacity-95"
        style={{
          shadowColor: '#023459',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
          elevation: 3,
        }}>
        <View className="flex-row gap-4 p-3.5">
          <View className="h-[92px] w-[92px] overflow-hidden rounded-[22px] bg-ash-grey-100">
            <ResolvedImage
              uri={item.meal.thumbnailUrl ?? item.meal.imageUrl}
              className="h-full w-full"
              resizeMode="cover"
              fallback={
                <View className="h-full w-full items-center justify-center bg-blue-spruce-50">
                  <Ionicons name="restaurant" size={28} color={palette['blue-spruce'][400]} />
                </View>
              }
            />
          </View>

          <View className="min-w-0 flex-1 justify-between py-0.5">
            <View>
              <Text className="text-[12px] font-sans-semibold text-ash-grey-500" numberOfLines={1}>
                {name}
                {mealType ? ` · ${mealType}` : ''}
              </Text>
              <Text
                className="mt-1 font-sans-bold text-[17px] leading-6 text-blue-spruce-900"
                numberOfLines={2}>
                {mealName}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: tone.bg }}>
                <Text className="text-[11px] font-sans-semibold" style={{ color: tone.text }}>
                  {waiting}
                </Text>
              </View>
              {needsPickup ? (
                <View className="rounded-full bg-cinnamon-wood-400 px-2.5 py-1">
                  <Text className="text-[11px] font-sans-bold text-white">Pickup</Text>
                </View>
              ) : pickedBy ? (
                <Text className="text-[11px] text-ash-grey-500" numberOfLines={1}>
                  With {pickedBy}
                </Text>
              ) : (
                <Text className="text-[11px] text-ash-grey-400">Ready to review</Text>
              )}
            </View>
          </View>

          <View className="items-center justify-center pr-1">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-ash-grey-50">
              <Ionicons name="chevron-forward" size={18} color={palette['blue-spruce'][600]} />
            </View>
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

  const load = useCallback(
    async (silent = false) => {
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
    },
    [toast],
  );

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
          <View className="min-w-0 flex-1 pr-3">
            <GradientHeaderTitle>Queue</GradientHeaderTitle>
            <Text className="mt-1 text-sm text-white/80">
              {items.length === 0
                ? 'Nothing waiting right now'
                : `${items.length} meal${items.length === 1 ? '' : 's'} to review`}
            </Text>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>

      <ContentSheet className="flex-1 pt-4">
        {loading && items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette['blue-spruce'][600]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load(true);
                }}
                tintColor={palette['blue-spruce'][600]}
              />
            }
            contentContainerStyle={{
              paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
              gap: 12,
            }}>
            {items.length === 0 ? (
              <Animated.View entering={enteringCard(0)}>
                <View className="items-center rounded-[28px] bg-ash-grey-50 px-6 py-12">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-shamrock-50">
                    <Ionicons name="checkmark-done" size={28} color={palette.shamrock[600]} />
                  </View>
                  <Text className="mt-4 font-sans-bold text-lg text-blue-spruce-900">Queue is clear</Text>
                  <Text className="mt-1 text-center text-[15px] leading-6 text-ash-grey-500">
                    New patient meals will show up here as soon as they’re submitted.
                  </Text>
                </View>
              </Animated.View>
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
