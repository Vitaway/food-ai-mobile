import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { Text } from '@/components/ui/Text';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { MealTypeId } from '@/constants/mealTypes';
import type { MealSubmissionStatus } from '@/types';

export type MealTimelineItem = {
  id: string;
  mealTypeId: MealTypeId;
  label: string;
  subtitle?: string;
  time?: string;
  items?: string[];
  logged: boolean;
  calories?: number;
  status?: MealSubmissionStatus;
  pending?: boolean;
};

type MealTimelineProps = {
  dateLabel: string;
  summary?: string;
  meals: MealTimelineItem[];
  onMealPress?: (mealId: string) => void;
  onAddMeal?: (mealTypeId: MealTypeId) => void;
};

function EmptySlotCard({
  meal,
  onAddMeal,
}: {
  meal: MealTimelineItem;
  onAddMeal?: (mealTypeId: MealTypeId) => void;
}) {
  const handlePress = useSinglePress(() => onAddMeal?.(meal.mealTypeId));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Log ${meal.label}`}
      className="min-h-[72px] flex-1 flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-4 py-3 active:bg-ash-grey-100">
      <View className="flex-1 pr-3">
        <Text className="font-sans-semibold text-base text-neutral-900">{meal.label}</Text>
        <Text className="mt-1 text-sm text-neutral-500">Tap to log this meal</Text>
      </View>
      <View className="h-8 w-8 items-center justify-center rounded-full border border-dashed border-blue-spruce-400 bg-white">
        <Ionicons name="add" size={18} color="#023459" />
      </View>
    </Pressable>
  );
}

function LoggedSlotCard({
  meal,
  onMealPress,
}: {
  meal: MealTimelineItem;
  onMealPress?: (mealId: string) => void;
}) {
  const handlePress = useSinglePress(() => onMealPress?.(meal.id));

  return (
    <View className="min-h-[72px] flex-1 flex-row items-start justify-between rounded-2xl bg-ash-grey-50 px-4 py-3">
      <Pressable className="flex-1 pr-3" onPress={handlePress}>
        <Text className="font-sans-semibold text-base text-neutral-900">{meal.label}</Text>
        {meal.subtitle ? <Text className="mt-0.5 text-xs text-neutral-400">{meal.subtitle}</Text> : null}
        {meal.pending ? (
          <Text className="mt-1 text-sm text-neutral-500">Analysis in progress…</Text>
        ) : meal.items?.length ? (
          <Text className="mt-1 text-sm leading-5 text-neutral-500">{meal.items.join(', ')}</Text>
        ) : null}
        {meal.calories ? (
          <Text className="mt-1 text-xs font-sans-medium text-shamrock-700">{meal.calories} kcal</Text>
        ) : null}
        {meal.status && meal.pending ? (
          <View className="mt-2 self-start">
            <MealStatusBadge status={meal.status} />
          </View>
        ) : null}
      </Pressable>

      <View className="items-end gap-2">
        {meal.time ? <Text className="text-xs text-neutral-400">{meal.time}</Text> : null}
        {meal.pending ? (
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-spruce-100">
            <Ionicons name="time-outline" size={16} color="#023459" />
          </View>
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-900">
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          </View>
        )}
      </View>
    </View>
  );
}

export function MealTimeline({ dateLabel, summary, meals, onMealPress, onAddMeal }: MealTimelineProps) {
  const showHeader = Boolean(dateLabel || summary);

  return (
    <View className="pb-1">
      {showHeader ? (
        <View className="mb-5 flex-row items-start justify-between">
          <View className="flex-1">
            {dateLabel ? <Text className="font-sans-bold text-xl text-neutral-900">{dateLabel}</Text> : null}
            {summary ? <Text className="mt-1 text-sm text-neutral-500">{summary}</Text> : null}
          </View>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-ash-grey-100">
            <Ionicons name="calendar-outline" size={20} color="#4f5346" />
          </Pressable>
        </View>
      ) : null}

      <View className="relative">
        <View className="absolute bottom-4 left-[18px] top-4 w-px bg-ash-grey-200" />

        {meals.map((meal, index) => (
          <View key={meal.id} className={`flex-row gap-4 ${index < meals.length - 1 ? 'mb-5' : ''}`}>
            <View className="w-9 items-center pt-1">
              <View className={`h-2.5 w-2.5 rounded-full ${meal.logged ? 'bg-shamrock-500' : 'bg-ash-grey-300'}`} />
            </View>

            {meal.logged ? (
              <LoggedSlotCard meal={meal} onMealPress={onMealPress} />
            ) : (
              <EmptySlotCard meal={meal} onAddMeal={onAddMeal} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
