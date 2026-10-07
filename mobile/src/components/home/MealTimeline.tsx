import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { Text } from '@/components/ui/Text';
import { tf, useI18n } from '@/context/LocaleContext';
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
  /** Amber / striped estimate awaiting Grace. */
  estimate?: boolean;
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
  const { t } = useI18n();
  const handlePress = useSinglePress(() => onAddMeal?.(meal.mealTypeId));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={tf(t.home.logMealA11y, { label: meal.label })}
      className="min-h-[72px] flex-1 flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-4 py-3 active:bg-ash-grey-100">
      <View className="flex-1 pr-3">
        <Text className="font-sans-semibold text-base text-neutral-900">{meal.label}</Text>
        <Text className="mt-1 text-sm text-neutral-500">{t.home.tapToLogMeal}</Text>
      </View>
      <View className="h-8 w-8 items-center justify-center rounded-full border border-dashed border-blue-spruce-400 bg-white">
        <Ionicons name="add" size={18} color="#1a3a2a" />
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
  const { t } = useI18n();
  const handlePress = useSinglePress(() => onMealPress?.(meal.id));
  const isEstimate = Boolean(meal.estimate || meal.pending);

  return (
    <View
      className={`min-h-[80px] flex-1 flex-row items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 ${
        isEstimate ? 'bg-cinnamon-wood-50' : 'bg-white'
      }`}
      style={
        isEstimate
          ? {
              borderWidth: 1,
              borderColor: '#f5d48a',
              borderStyle: 'dashed',
            }
          : {
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 1,
            }
      }>
      {/* Plate placeholder */}
      <View
        className={`h-14 w-14 items-center justify-center rounded-full ${
          isEstimate ? 'bg-cinnamon-wood-100' : 'bg-ash-grey-100'
        }`}>
        <Ionicons
          name="restaurant-outline"
          size={24}
          color={isEstimate ? '#d48a28' : '#1a3a2a'}
        />
      </View>

      <Pressable className="min-w-0 flex-1" onPress={handlePress}>
        <Text className="font-sans-semibold text-base leading-5 text-neutral-900" numberOfLines={2}>
          {meal.label}
        </Text>
        {meal.subtitle || meal.time ? (
          <Text className="mt-0.5 text-xs text-neutral-500" numberOfLines={1}>
            {[meal.subtitle, meal.time].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {meal.status ? (
          <View className="mt-1.5 self-start">
            <MealStatusBadge status={meal.status} />
          </View>
        ) : null}
        {isEstimate ? (
          <Text className="mt-1 text-xs text-cinnamon-wood-700">{t.home.graceWillCheck}</Text>
        ) : null}
      </Pressable>

      {meal.calories != null ? (
        <View className="items-end">
          <Text className="font-sans-bold text-base text-neutral-900">{meal.calories}</Text>
          <Text className="text-[10px] font-sans-medium text-neutral-500">{t.common.kcal}</Text>
        </View>
      ) : null}
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
        </View>
      ) : null}

      <View className="gap-3">
        {meals.map((meal) => (
          <View key={meal.id}>
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
