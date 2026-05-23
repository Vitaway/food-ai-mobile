import { View } from 'react-native';
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
};

export function LastMealCard({ meal }: LastMealCardProps) {
  if (!meal) {
    return (
      <View className="rounded-3xl border border-dashed border-ash-grey-300 bg-white p-5">
        <Text className="font-sans-semibold text-neutral-800">No meals logged yet</Text>
        <Text className="mt-1 text-sm text-neutral-500">Tap Log to capture your first meal.</Text>
      </View>
    );
  }

  return (
    <View className="rounded-3xl bg-white p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-lg text-neutral-900">Last meal</Text>
        <Text className="text-xs uppercase tracking-wide text-blue-spruce-700">{meal.status.replace('_', ' ')}</Text>
      </View>
      <Text className="mt-2 capitalize text-neutral-700">{meal.mealType.replaceAll('_', ' ')}</Text>
      <Text className="mt-1 text-sm text-neutral-500">
        {meal.totalNutrition ? `${meal.totalNutrition.caloriesKcal} kcal` : 'Analysis pending'}
      </Text>
    </View>
  );
}
