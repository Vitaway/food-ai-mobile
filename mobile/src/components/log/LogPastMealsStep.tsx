import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import { MEAL_TYPE_OPTIONS } from '@/constants/mealTypes';
import type { MealSubmission } from '@/types';
import { formatDayHeading, formatTime, toLocalDateKey } from '@/utils/dates';

export function canRepeatMeal(meal: MealSubmission): boolean {
  return Boolean(meal.items?.length && meal.totalNutrition);
}

function mealTypeLabel(mealType: MealSubmission['mealType']) {
  return MEAL_TYPE_OPTIONS.find((option) => option.id === mealType)?.label ?? 'Meal';
}

function mealTitle(meal: MealSubmission) {
  return (
    meal.mealName?.trim() ||
    meal.textInput?.trim() ||
    meal.items?.map((item) => item.label).join(', ') ||
    'Past meal'
  );
}

function mealSubtitle(meal: MealSubmission) {
  const items = meal.items?.map((item) => item.label).filter(Boolean) ?? [];
  if (!items.length) return null;
  const preview = items.slice(0, 3).join(', ');
  return items.length > 3 ? `${preview}…` : preview;
}

type LogPastMealsStepProps = {
  meals: MealSubmission[];
  loading?: boolean;
  onSelect: (meal: MealSubmission) => void;
};

export function LogPastMealsStep({ meals, loading = false, onSelect }: LogPastMealsStepProps) {
  const repeatable = meals
    .filter(canRepeatMeal)
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const groups = repeatable.reduce<Array<{ dayKey: string; meals: MealSubmission[] }>>((acc, meal) => {
    const dayKey = toLocalDateKey(new Date(meal.submittedAt));
    const existing = acc.find((group) => group.dayKey === dayKey);
    if (existing) {
      existing.meals.push(meal);
      return acc;
    }
    acc.push({ dayKey, meals: [meal] });
    return acc;
  }, []);

  if (!repeatable.length) {
    return (
      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">No meals to repeat yet</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          Once you have a meal with nutrition details (usually after coach approval), it will show up
          here so you can log it again in one tap.
        </Text>
      </LogCard>
    );
  }

  return (
    <View className="gap-3">
      <LogCard className="border border-blue-spruce-100 bg-blue-spruce-50/40">
        <Text className="font-sans-semibold text-lg text-neutral-900">Repeat a meal</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-600">
          Pick something you already ate. We reuse the ingredients and nutrition — then you submit
          the meal.
        </Text>
      </LogCard>

      {groups.map((group) => (
        <View key={group.dayKey} className="gap-2">
          <Text className="px-1 text-xs font-sans-semibold uppercase tracking-wide text-neutral-400">
            {formatDayHeading(group.dayKey)}
          </Text>
          {group.meals.map((meal) => {
            const subtitle = mealSubtitle(meal);
            const calories = Math.round(meal.totalNutrition?.caloriesKcal ?? 0);

            return (
              <Pressable
                key={meal.id}
                disabled={loading}
                onPress={() => onSelect(meal)}
                className="overflow-hidden rounded-3xl bg-white active:opacity-90"
                style={{
                  shadowColor: '#1a1c17',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 1,
                }}>
                <View className="flex-row items-center gap-3 p-3">
                  <View className="h-14 w-14 overflow-hidden rounded-2xl bg-ash-grey-100">
                    {meal.imageUrl ? (
                      <Image source={{ uri: meal.imageUrl }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Ionicons name="restaurant-outline" size={22} color="#848a75" />
                      </View>
                    )}
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-semibold text-base text-neutral-900" numberOfLines={1}>
                      {mealTitle(meal)}
                    </Text>
                    <Text className="mt-0.5 text-xs text-neutral-400">
                      {mealTypeLabel(meal.mealType)} · {formatTime(meal.submittedAt)}
                      {calories > 0 ? ` · ${calories} kcal` : ''}
                    </Text>
                    {subtitle ? (
                      <Text className="mt-1 text-sm leading-5 text-neutral-500" numberOfLines={2}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#848a75" />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
