import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useMeals } from '@/context/MealsContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useProfileBack } from '@/hooks/useProfileBack';
import { formatDisplayDate, parseDateKey, todayKey } from '@/utils/dates';
import { formatGlasses, mlToGlasses } from '@/utils/waterUnits';

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function ProfileDayDetailScreen() {
  const router = useRouter();
  const handleBack = useProfileBack();
  const params = useLocalSearchParams<{ date?: string }>();
  const selectedDate = isDateKey(params.date ?? '') ? (params.date as string) : todayKey();
  const { meals } = useMeals();
  const { dashboard } = useDashboard(selectedDate);

  const mealsForDay = useMemo(
    () =>
      meals
        .filter((meal) => meal.submittedAt.slice(0, 10) === selectedDate)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [meals, selectedDate],
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Day details" onBack={handleBack} />
      <StackScreenBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <View className="rounded-2xl border border-ash-grey-100 p-4">
            <Text className="font-sans-semibold text-base text-neutral-900">
              {formatDisplayDate(parseDateKey(selectedDate))}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Calories</Text>
                <Text className="mt-1 font-sans-semibold text-neutral-900">
                  {dashboard.caloriesConsumed}/{dashboard.calorieTarget}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Water</Text>
                <Text className="mt-1 font-sans-semibold text-neutral-900">
                  {formatGlasses(mlToGlasses(dashboard.waterMl))}/
                  {formatGlasses(mlToGlasses(dashboard.waterTargetMl))} glasses
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Score</Text>
                <Text className="mt-1 font-sans-semibold text-shamrock-700">{dashboard.healthScore}</Text>
              </View>
            </View>
          </View>

          <View className="rounded-2xl border border-ash-grey-100 p-4">
            <Text className="font-sans-semibold text-base text-neutral-900">Meals</Text>
            <Text className="mt-1 text-sm text-neutral-500">{mealsForDay.length} logged</Text>

            {mealsForDay.length === 0 ? (
              <View className="mt-3 rounded-xl bg-ash-grey-50 px-4 py-4">
                <Text className="text-sm text-neutral-500">No meals logged for this day.</Text>
              </View>
            ) : (
              <View className="mt-3 gap-3">
                {mealsForDay.map((meal) => (
                  <Pressable
                    key={meal.id}
                    onPress={() => router.push(`/meal/${meal.id}`)}
                    className="overflow-hidden rounded-2xl border border-ash-grey-100 bg-white active:bg-ash-grey-50">
                    {meal.imageUrl ? (
                      <Image source={{ uri: meal.imageUrl }} className="h-36 w-full bg-ash-grey-100" resizeMode="cover" />
                    ) : (
                      <View className="h-20 w-full items-center justify-center bg-ash-grey-50">
                        <Ionicons name="image-outline" size={22} color="#9ca3af" />
                      </View>
                    )}
                    <View className="flex-row items-center justify-between gap-3 px-3 py-3">
                      <View className="min-w-0 flex-1">
                        <Text className="font-sans-semibold text-neutral-900" numberOfLines={1}>
                          {meal.mealName ?? 'Logged meal'}
                        </Text>
                        <Text className="mt-0.5 text-xs text-neutral-500">
                          {new Date(meal.submittedAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <MealStatusBadge status={meal.status} size="sm" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
