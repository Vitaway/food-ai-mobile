import { useEffect, useMemo, useState } from 'react';

import { MEAL_TYPES, type MealTypeId } from '@/constants/mealTypes';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { services } from '@/services';
import { buildAnalyticsSnapshot } from '@/services/local/analytics';
import { buildCoachInsights, filterMealSwapSuggestions } from '@/services/local/recommendations';
import type { DailyLog, MealSubmission } from '@/types';
import { getDateWindow, parseDateKey, toLocalDateKey } from '@/utils/dates';
import { mlToCups } from '@/utils/waterUnits';

export type DailyInsightPoint = {
  date: string;
  label: string;
  calories: number;
  meals: number;
  waterCups: number;
};

export type MealCalorieRow = {
  id: MealTypeId;
  label: string;
  calories: number;
  color: string;
};

export type MacroBarRow = {
  label: string;
  value: number;
  target: number;
  color: string;
  hex: string;
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#1D9E75',
  lunch: '#023459',
  dinner: '#16304D',
  mid_morning_snack: '#5B8FC7',
  afternoon_snack: '#7BA3D0',
  evening_snack: '#ff6f32',
  pre_workout: '#848a75',
  post_workout: '#4f5346',
};

function mealsInWindow(meals: MealSubmission[], days: number) {
  const { start, end } = getDateWindow(days);
  return meals.filter(
    (meal) =>
      meal.status === 'approved' &&
      meal.submittedAt.slice(0, 10) >= start &&
      meal.submittedAt.slice(0, 10) <= end,
  );
}

function buildDailySeries(
  meals: MealSubmission[],
  dailyLogs: DailyLog[],
  days: number,
): DailyInsightPoint[] {
  const { start, end } = getDateWindow(days);
  const approved = mealsInWindow(meals, days);
  const points: DailyInsightPoint[] = [];
  const cursor = parseDateKey(start);
  const endDate = parseDateKey(end);

  while (cursor <= endDate) {
    const date = toLocalDateKey(cursor);
    const dayMeals = approved.filter((meal) => meal.submittedAt.slice(0, 10) === date);
    const calories = dayMeals.reduce((sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0), 0);
    const log = dailyLogs.find((entry) => entry.date === date);
    const label =
      days <= 7
        ? cursor.toLocaleDateString('en-US', { weekday: 'narrow' })
        : cursor.getDate().toString();

    points.push({
      date,
      label,
      calories,
      meals: dayMeals.length,
      waterCups: mlToCups(log?.waterMl ?? 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export function useInsightsData(period: 7 | 30) {
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    services.mealsRepository.getDailyLogs().then(setDailyLogs);
  }, [meals]);

  const targets = useMemo(
    () =>
      profile?.macroTargets ?? {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      },
    [profile?.macroTargets],
  );

  const waterTarget = profile?.waterTargetMl ?? 0;

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
        limit: 4,
      }),
    [profile?.dietaryPreferences, profile?.goal],
  );

  const stats = useMemo(() => {
    const approved = mealsInWindow(meals, period);
    const totalCalories = approved.reduce((sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0), 0);
    const activeDays = new Set(approved.map((meal) => meal.submittedAt.slice(0, 10))).size;
    const avgCalories = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;

    const { start, end } = getDateWindow(period);
    const logsInWindow = dailyLogs.filter((log) => log.date >= start && log.date <= end);
    const hydrationHits = logsInWindow.filter((log) => log.waterMl >= waterTarget).length;
    const hydrationRate = Math.round((hydrationHits / period) * 100);
    const avgWaterCups =
      logsInWindow.length > 0
        ? Math.round((logsInWindow.reduce((sum, log) => sum + mlToCups(log.waterMl), 0) / logsInWindow.length) * 10) /
          10
        : 0;

    const caloriesByType: MealCalorieRow[] = MEAL_TYPES.map((type) => ({
      id: type.id,
      label: type.label,
      calories: approved
        .filter((meal) => meal.mealType === type.id)
        .reduce((sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0), 0),
      color: MEAL_COLORS[type.id] ?? '#848a75',
    }))
      .filter((entry) => entry.calories > 0)
      .sort((a, b) => b.calories - a.calories);

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
    const macroBars: MacroBarRow[] = [
      {
        label: 'Protein',
        value: macroTotals.proteinG / divisor,
        target: targets.proteinG,
        color: 'bg-shamrock-500',
        hex: '#1D9E75',
      },
      {
        label: 'Carbs',
        value: macroTotals.carbsG / divisor,
        target: targets.carbsG,
        color: 'bg-blue-spruce-500',
        hex: '#023459',
      },
      {
        label: 'Fat',
        value: macroTotals.fatG / divisor,
        target: targets.fatG,
        color: 'bg-cinnamon-wood-400',
        hex: '#ff6f32',
      },
    ];

    const dailySeries = buildDailySeries(meals, dailyLogs, period);
    const maxDailyCalories = Math.max(...dailySeries.map((point) => point.calories), targets.calories, 1);
    const loggingRate = Math.round((activeDays / period) * 100);

    return {
      mealsCount: approved.length,
      avgCalories,
      hydrationRate,
      avgWaterCups,
      activeDays,
      loggingRate,
      caloriesByType,
      maxTypeCalories,
      macroBars,
      dailySeries,
      maxDailyCalories,
      hasData: approved.length > 0,
    };
  }, [dailyLogs, meals, period, targets, waterTarget]);

  return {
    snapshot,
    coachInsights,
    mealSwaps,
    stats,
    calorieTarget: targets.calories,
    waterTargetCups: mlToCups(waterTarget),
  };
}
