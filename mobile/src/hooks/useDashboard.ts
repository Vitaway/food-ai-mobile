import { useEffect, useMemo, useState } from 'react';

import { getDailyMealSlots, MEAL_TYPES } from '@/constants/mealTypes';
import { isMealReadable } from '@/constants/mealStatus';
import type { MealTimelineItem } from '@/components/home/MealTimeline';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { services } from '@/services';
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

export function useDashboard(selectedDate = todayKey()) {
  const { profile } = useProfile();
  const { meals } = useMeals();
  const [waterMl, setWaterMl] = useState(0);

  useEffect(() => {
    services.mealsRepository.getDailyLog(selectedDate).then((log) => setWaterMl(log.waterMl));
  }, [selectedDate, meals]);

  return useMemo(() => {
    const targets = profile?.macroTargets ?? {
      calories: 2100,
      proteinG: 140,
      carbsG: 220,
      fatG: 70,
      fiberG: 30,
    };

    const dayMealsAll = meals.filter((meal) => isSameDay(meal.submittedAt, selectedDate));
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
      lastMeal: [...dayMealsAll].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0],
    };

    const dailySlots = getDailyMealSlots(profile?.mealsPerDay);

    const timeline: MealTimelineItem[] = dailySlots.map((slotId) => {
      const mealType = MEAL_TYPES.find((type) => type.id === slotId)!;
      const logged = dayMealsAll.find((meal) => meal.mealType === slotId);
      if (!logged) {
        return { id: slotId, mealTypeId: slotId, label: mealType.label, logged: false };
      }

      const readable = isMealReadable(logged.status);

      return {
        id: logged.id,
        mealTypeId: slotId,
        label: logged.mealName ?? mealType.label,
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
      mealsPerDay: dailySlots.length,
      displayName: profile?.displayName ?? 'there',
    };
  }, [meals, profile, selectedDate, waterMl]);
}
