import { Image, Pressable, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { useSinglePress } from '@/hooks/useSinglePress';
import { isMealReadable } from '@/constants/mealStatus';
import { Text } from '@/components/ui/Text';
import type { DailyDashboard } from '@/types';

type HealthScoreBadgeProps = {
  score: number;
};

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  const containerClass =
    score >= 80
      ? 'bg-shamrock-100'
      : score >= 60
        ? 'bg-cinnamon-wood-100'
        : 'bg-cinnamon-wood-200';
  const textClass =
    score >= 80
      ? 'text-shamrock-700'
      : score >= 60
        ? 'text-cinnamon-wood-700'
        : 'text-cinnamon-wood-800';

  return (
    <View className={`rounded-full px-3 py-1 ${containerClass}`}>
      <Text className={`font-sans-semibold text-sm ${textClass}`}>Health {score}</Text>
    </View>
  );
}

type LastMealCardProps = {
  meal?: DailyDashboard['lastMeal'];
  onPress?: (mealId: string) => void;
};

export function LastMealCard({ meal, onPress }: LastMealCardProps) {
  const handlePress = useSinglePress(meal && onPress ? () => onPress(meal.id) : undefined);

  if (!meal) {
    return (
      <View className="rounded-3xl border border-dashed border-ash-grey-300 bg-white p-5">
        <Text className="font-sans-semibold text-neutral-800">No meals logged yet</Text>
        <Text className="mt-1 text-sm text-neutral-500">Tap Log to capture your first meal.</Text>
      </View>
    );
  }

  const readable = isMealReadable(meal.status);
  const content = (
    <View className="flex-row gap-3">
      {meal.imageUrl ? (
        <Image source={{ uri: meal.imageUrl }} className="h-16 w-16 rounded-2xl" resizeMode="cover" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-ash-grey-100">
          <Text className="text-2xl">🍽️</Text>
        </View>
      )}
      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 font-sans-semibold text-lg text-neutral-900" numberOfLines={1}>
            {meal.mealName ?? 'Logged meal'}
          </Text>
          <MealStatusBadge status={meal.status} />
        </View>
        <Text className="mt-1 capitalize text-sm text-neutral-500">{meal.mealType.replaceAll('_', ' ')}</Text>
        <Text className="mt-1 text-sm text-neutral-600">
          {readable && meal.totalNutrition
            ? `${meal.totalNutrition.caloriesKcal} kcal`
            : 'Full nutrition unlocks when review completes'}
        </Text>
      </View>
    </View>
  );

  if (onPress && handlePress) {
    return (
      <Pressable onPress={handlePress} className="rounded-3xl bg-white p-5 shadow-sm active:opacity-90">
        <Text className="mb-3 font-sans-semibold text-sm uppercase tracking-wide text-neutral-500">Last meal</Text>
        {content}
      </Pressable>
    );
  }

  return (
    <View className="rounded-3xl bg-white p-5 shadow-sm">
      <Text className="mb-3 font-sans-semibold text-sm uppercase tracking-wide text-neutral-500">Last meal</Text>
      {content}
    </View>
  );
}
