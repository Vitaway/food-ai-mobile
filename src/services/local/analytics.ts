import { MEAL_TYPES } from '@/constants/mealTypes';
import type { DailyLog, MealSubmission, MacroTargets } from '@/types';
import { getDateWindow, todayKey } from '@/utils/dates';

type MacroKey = 'proteinG' | 'carbsG' | 'fatG' | 'fiberG';

export type AnalyticsSnapshot = {
  windowLabel: string;
  calorieDistribution: string;
  macroTrend: string;
  habitDetection: string;
};

const macroLabel: Record<MacroKey, string> = {
  proteinG: 'Protein',
  carbsG: 'Carbs',
  fatG: 'Fat',
  fiberG: 'Fiber',
};

function dateWindow(days: number, anchor = new Date()) {
  return getDateWindow(days, anchor);
}

function inWindow(dateKey: string, start: string, end: string) {
  return dateKey >= start && dateKey <= end;
}

export function buildAnalyticsSnapshot({
  meals,
  dailyLogs,
  macroTargets,
  waterTargetMl,
  days,
}: {
  meals: MealSubmission[];
  dailyLogs: DailyLog[];
  macroTargets: MacroTargets;
  waterTargetMl: number;
  days: number;
}): AnalyticsSnapshot {
  const { start, end } = dateWindow(days);
  const approvedMeals = meals.filter((meal) => meal.status === 'approved');
  const windowMeals = approvedMeals.filter((meal) => inWindow(meal.submittedAt.slice(0, 10), start, end));
  const windowLogs = dailyLogs.filter((log) => inWindow(log.date, start, end));

  const caloriesByType = MEAL_TYPES.reduce<Record<string, number>>((acc, type) => {
    acc[type.id] = 0;
    return acc;
  }, {});

  let totalCalories = 0;
  const macroTotals: Record<MacroKey, number> = {
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };

  for (const meal of windowMeals) {
    const calories = meal.totalNutrition?.caloriesKcal ?? 0;
    totalCalories += calories;
    caloriesByType[meal.mealType] += calories;
    macroTotals.proteinG += meal.totalNutrition?.proteinG ?? 0;
    macroTotals.carbsG += meal.totalNutrition?.carbsG ?? 0;
    macroTotals.fatG += meal.totalNutrition?.fatG ?? 0;
    macroTotals.fiberG += meal.totalNutrition?.fiberG ?? 0;
  }

  const topMealType = Object.entries(caloriesByType).sort((a, b) => b[1] - a[1])[0];
  const topTypeLabel = MEAL_TYPES.find((type) => type.id === topMealType?.[0])?.label ?? 'No data';
  const topTypePercent = totalCalories > 0 && topMealType ? Math.round((topMealType[1] / totalCalories) * 100) : 0;
  const calorieDistribution =
    totalCalories > 0 ? `${topTypePercent}% ${topTypeLabel.toLowerCase()}` : 'No meals logged';

  const daysWithMeals = new Set(windowMeals.map((meal) => meal.submittedAt.slice(0, 10))).size;
  const activeDays = Math.max(1, daysWithMeals);
  const avgMacros: Record<MacroKey, number> = {
    proteinG: macroTotals.proteinG / activeDays,
    carbsG: macroTotals.carbsG / activeDays,
    fatG: macroTotals.fatG / activeDays,
    fiberG: macroTotals.fiberG / activeDays,
  };
  const strongestMacro = (Object.keys(avgMacros) as MacroKey[]).sort((a, b) => {
    const left = macroTargets[a] > 0 ? avgMacros[a] / macroTargets[a] : 0;
    const right = macroTargets[b] > 0 ? avgMacros[b] / macroTargets[b] : 0;
    return right - left;
  })[0];
  const strongestDelta =
    macroTargets[strongestMacro] > 0
      ? Math.round(((avgMacros[strongestMacro] - macroTargets[strongestMacro]) / macroTargets[strongestMacro]) * 100)
      : 0;
  const macroTrend =
    windowMeals.length > 0
      ? `${macroLabel[strongestMacro]} ${strongestDelta >= 0 ? '+' : ''}${strongestDelta}%`
      : 'No trend yet';

  const lowProteinDays = new Set(
    windowMeals
      .filter((meal) => (meal.totalNutrition?.proteinG ?? 0) < macroTargets.proteinG * 0.2)
      .map((meal) => meal.submittedAt.slice(0, 10)),
  ).size;
  const hydrationDays = windowLogs.filter((log) => log.waterMl >= waterTargetMl).length;
  const hydrationPercent = Math.round((hydrationDays / Math.max(1, days)) * 100);
  const habitDetection =
    windowMeals.length > 0
      ? hydrationPercent >= 60
        ? `${hydrationPercent}% hydration goal days`
        : `${lowProteinDays} low-protein days`
      : 'Log meals to unlock patterns';

  return {
    windowLabel: `${days} day`,
    calorieDistribution,
    macroTrend,
    habitDetection,
  };
}

export function getAnalyticsWindows(params: {
  meals: MealSubmission[];
  dailyLogs: DailyLog[];
  macroTargets: MacroTargets;
  waterTargetMl: number;
}) {
  return [
    {
      label: 'Last 7 days',
      snapshot: buildAnalyticsSnapshot({ ...params, days: 7 }),
    },
    {
      label: 'Last 30 days',
      snapshot: buildAnalyticsSnapshot({ ...params, days: 30 }),
    },
    {
      label: `As of ${todayKey()}`,
      snapshot: buildAnalyticsSnapshot({ ...params, days: 14 }),
    },
  ];
}
