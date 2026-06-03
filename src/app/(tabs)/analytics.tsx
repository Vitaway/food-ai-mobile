import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { InsightPeriodToggle } from '@/components/analytics/InsightPeriodToggle';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { MEAL_TYPES } from '@/constants/mealTypes';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { services } from '@/services';
import { RecommendationList } from '@/components/recommendations/RecommendationList';
import { buildAnalyticsSnapshot } from '@/services/local/analytics';
import { buildCoachInsights, filterMealSwapSuggestions } from '@/services/local/recommendations';
import type { DailyLog, MealSubmission } from '@/types';
import { getDateWindow } from '@/utils/dates';

function mealsInWindow(meals: MealSubmission[], days: number) {
  const { start, end } = getDateWindow(days);
  return meals.filter(
    (meal) =>
      meal.status === 'approved' &&
      meal.submittedAt.slice(0, 10) >= start &&
      meal.submittedAt.slice(0, 10) <= end,
  );
}

export default function AnalyticsScreen() {
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    services.mealsRepository.getDailyLogs().then(setDailyLogs);
  }, [meals]);

  const targets = useMemo(
    () =>
      profile?.macroTargets ?? {
        calories: 2100,
        proteinG: 140,
        carbsG: 220,
        fatG: 70,
        fiberG: 30,
      },
    [profile?.macroTargets],
  );

  const waterTarget = profile?.waterTargetMl ?? 2450;

  const snapshot = useMemo(
    () =>
      buildAnalyticsSnapshot({
        meals,
        dailyLogs,
        macroTargets: targets,
        waterTargetMl: waterTarget,
        days: period,
      }),
    [dailyLogs, meals, period, targets, waterTarget],
  );

  const coachInsights = useMemo(
    () =>
      buildCoachInsights({
        meals,
        dailyLogs,
        macroTargets: targets,
        waterTargetMl: waterTarget,
        days: period,
      }),
    [dailyLogs, meals, period, targets, waterTarget],
  );

  const mealSwaps = useMemo(
    () =>
      filterMealSwapSuggestions({
        goal: profile?.goal ?? 'maintain_weight',
        dietaryPreferences: profile?.dietaryPreferences ?? [],
        limit: 3,
      }),
    [profile?.dietaryPreferences, profile?.goal],
  );

  const stats = useMemo(() => {
    const { start, end } = getDateWindow(period);
    const approved = mealsInWindow(meals, period);
    const totalCalories = approved.reduce((sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0), 0);
    const activeDays = new Set(approved.map((meal) => meal.submittedAt.slice(0, 10))).size;
    const avgCalories = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;

    const logsInWindow = dailyLogs.filter((log) => log.date >= start && log.date <= end);
    const hydrationHits = logsInWindow.filter((log) => log.waterMl >= waterTarget).length;
    const hydrationRate = Math.round((hydrationHits / period) * 100);

    const caloriesByType = MEAL_TYPES.map((type) => {
      const calories = approved
        .filter((meal) => meal.mealType === type.id)
        .reduce((sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0), 0);
      return { label: type.label, calories };
    })
      .filter((entry) => entry.calories > 0)
      .sort((a, b) => b.calories - a.calories)
      .slice(0, 5);

    const maxTypeCalories = Math.max(caloriesByType[0]?.calories ?? 0, 1);

    const macroTotals = approved.reduce(
      (acc, meal) => ({
        proteinG: acc.proteinG + (meal.totalNutrition?.proteinG ?? 0),
        carbsG: acc.carbsG + (meal.totalNutrition?.carbsG ?? 0),
        fatG: acc.fatG + (meal.totalNutrition?.fatG ?? 0),
      }),
      { proteinG: 0, carbsG: 0, fatG: 0 },
    );

    const divisor = Math.max(activeDays, 1);
    const macroBars = [
      { label: 'Protein', value: macroTotals.proteinG / divisor, target: targets.proteinG, color: 'bg-shamrock-500' },
      { label: 'Carbs', value: macroTotals.carbsG / divisor, target: targets.carbsG, color: 'bg-blue-spruce-500' },
      { label: 'Fat', value: macroTotals.fatG / divisor, target: targets.fatG, color: 'bg-cinnamon-wood-400' },
    ];

    return {
      mealsCount: approved.length,
      avgCalories,
      hydrationRate,
      caloriesByType,
      maxTypeCalories,
      macroBars,
    };
  }, [dailyLogs, meals, period, targets, waterTarget]);

  return (
    <View className="flex-1 bg-white">
      <GradientHeader>
        <GradientHeaderTitle>Insights</GradientHeaderTitle>
      </GradientHeader>

      <ContentSheet>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}>
          <InsightPeriodToggle value={period} onChange={setPeriod} />

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-4">
              <Text className="text-xs text-neutral-500">Meals</Text>
              <Text className="mt-1 font-sans-bold text-2xl text-neutral-900">{stats.mealsCount}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-4">
              <Text className="text-xs text-neutral-500">Avg kcal/day</Text>
              <Text className="mt-1 font-sans-bold text-2xl text-neutral-900">{stats.avgCalories}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-4">
              <Text className="text-xs text-neutral-500">Hydration</Text>
              <Text className="mt-1 font-sans-bold text-2xl text-shamrock-700">{stats.hydrationRate}%</Text>
            </View>
          </View>

          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4 shadow-sm">
            <Text className="font-sans-semibold text-base text-neutral-900">Calories by meal</Text>
            {stats.caloriesByType.length === 0 ? (
              <Text className="mt-3 text-sm text-neutral-500">Log meals to see distribution</Text>
            ) : (
              <View className="mt-4 gap-3">
                {stats.caloriesByType.map((entry) => (
                  <View key={entry.label}>
                    <View className="mb-1 flex-row justify-between gap-2">
                      <Text className="flex-1 text-sm text-neutral-600" numberOfLines={1}>
                        {entry.label}
                      </Text>
                      <Text className="font-sans-medium text-sm text-neutral-900">{entry.calories} kcal</Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
                      <View
                        className="h-full rounded-full bg-blue-spruce-500"
                        style={{
                          width: `${Math.min(Math.max((entry.calories / stats.maxTypeCalories) * 100, 6), 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4 shadow-sm">
            <Text className="font-sans-semibold text-base text-neutral-900">Daily macros (avg)</Text>
            <View className="mt-4 gap-3">
              {stats.macroBars.map((macro) => {
                const ratio = macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;
                return (
                  <View key={macro.label}>
                    <View className="mb-1 flex-row justify-between gap-2">
                      <Text className="text-sm text-neutral-600">{macro.label}</Text>
                      <Text className="font-sans-medium text-sm text-neutral-900">
                        {Math.round(macro.value)}g / {macro.target}g
                      </Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
                      <View className={`h-full rounded-full ${macro.color}`} style={{ width: `${ratio * 100}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="max-w-full rounded-full bg-blue-spruce-50 px-3 py-2">
              <Text className="text-xs font-sans-semibold text-blue-spruce-800" numberOfLines={2}>
                {snapshot.calorieDistribution}
              </Text>
            </View>
            <View className="max-w-full rounded-full bg-shamrock-50 px-3 py-2">
              <Text className="text-xs font-sans-semibold text-shamrock-800" numberOfLines={2}>
                {snapshot.macroTrend}
              </Text>
            </View>
            <View className="max-w-full rounded-full bg-cinnamon-wood-50 px-3 py-2">
              <Text className="text-xs font-sans-semibold text-cinnamon-wood-700" numberOfLines={2}>
                {snapshot.habitDetection}
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4 shadow-sm">
            <RecommendationList
              tips={coachInsights}
              swaps={mealSwaps}
              title="Coach insights"
            />
          </View>
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
