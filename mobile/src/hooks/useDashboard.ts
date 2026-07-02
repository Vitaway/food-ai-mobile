import { useMemo } from 'react';

import { MEAL_TYPES } from '@/constants/mealTypes';
import { isMealReadable } from '@/constants/mealStatus';
import type { MealTimelineItem } from '@/components/home/MealTimeline';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import type { DailyDashboard, MealSubmission } from '@/types';
import { formatTime, todayKey, toLocalDateKey } from '@/utils/dates';
import { calculateHealthScore } from '@/utils/nutrition';

function isSameDay(iso: string, dateKey: string) {
  return iso.slice(0, 10) === dateKey;
}

function computeStreak(meals: MealSubmission[]) {
  const daysWithMeals = new Set(
    meals.filter((meal) => meal.status === 'approved').map((meal) => meal.submittedAt.slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (daysWithMeals.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function mealTypeLabel(mealType: string) {
  return MEAL_TYPES.find((type) => type.id === mealType)?.label ?? 'Meal';
}

export function useDashboard(selectedDate = todayKey()) {
  const { profile } = useProfile();
  const { meals, dailyLog } = useMeals();
  const waterMl = selectedDate === dailyLog.date ? dailyLog.waterMl : 0;

  return useMemo(() => {
    const targets = profile?.macroTargets ?? {
      calories: 2100,
      proteinG: 140,
      carbsG: 220,
      fatG: 70,
      fiberG: 30,
    };

    const dayMealsAll = meals
      .filter((meal) => isSameDay(meal.submittedAt, selectedDate))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const dayMeals = dayMealsAll.filter((meal) => meal.status === 'approved');

    const macrosConsumed = dayMeals.reduce(
      (acc, meal) => ({
        proteinG: acc.proteinG + (meal.totalNutrition?.proteinG ?? 0),
        carbsG: acc.carbsG + (meal.totalNutrition?.carbsG ?? 0),
        fatG: acc.fatG + (meal.totalNutrition?.fatG ?? 0),
        fiberG: acc.fiberG + (meal.totalNutrition?.fiberG ?? 0),
      }),
      { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );

    const caloriesConsumed = dayMeals.reduce(
      (sum, meal) => sum + (meal.totalNutrition?.caloriesKcal ?? 0),
      0,
    );

    const dashboard: DailyDashboard = {
      date: selectedDate,
      caloriesConsumed: Math.round(caloriesConsumed),
      calorieTarget: targets.calories,
      macros: targets,
      macrosConsumed: {
        proteinG: Math.round(macrosConsumed.proteinG),
        carbsG: Math.round(macrosConsumed.carbsG),
        fatG: Math.round(macrosConsumed.fatG),
        fiberG: Math.round(macrosConsumed.fiberG),
      },
      waterMl,
      waterTargetMl: profile?.waterTargetMl ?? 2450,
      healthScore: calculateHealthScore(
        { calories: caloriesConsumed, ...macrosConsumed },
        targets,
      ),
      streakDays: computeStreak(meals),
      lastMeal: dayMealsAll[0],
    };

    const timeline: MealTimelineItem[] = dayMealsAll.map((logged) => {
      const readable = isMealReadable(logged.status);
      const slotLabel = mealTypeLabel(logged.mealType);

      return {
        id: logged.id,
        mealTypeId: logged.mealType,
        label: logged.mealName ?? slotLabel,
        subtitle: slotLabel,
        time: formatTime(logged.submittedAt),
        items: readable ? logged.items?.map((item) => item.label) : undefined,
        logged: true,
        calories: readable ? logged.totalNutrition?.caloriesKcal : undefined,
        status: logged.status,
        pending: !readable,
      };
    });

    return {
      dashboard,
      timeline,
      mealCount: dayMealsAll.length,
      displayName: profile?.displayName ?? 'there',
    };
  }, [meals, profile, selectedDate, waterMl]);
}
