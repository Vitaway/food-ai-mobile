import { useEffect, useMemo, useState } from 'react';

import { MEAL_TYPES } from '@/constants/mealTypes';
import type { MealTimelineItem } from '@/components/home/MealTimeline';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { getDailyLog } from '@/services/local/storage';
import type { DailyDashboard, MealSubmission } from '@/types';
import { formatTime, todayKey } from '@/utils/dates';
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

  while (daysWithMeals.has(cursor.toISOString().slice(0, 10))) {
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
    getDailyLog(selectedDate).then((log) => setWaterMl(log.waterMl));
  }, [selectedDate, meals]);

  return useMemo(() => {
    const targets = profile?.macroTargets ?? {
      calories: 2100,
      proteinG: 140,
      carbsG: 220,
      fatG: 70,
      fiberG: 30,
    };

    const dayMeals = meals.filter(
      (meal) => meal.status === 'approved' && isSameDay(meal.submittedAt, selectedDate),
    );

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
      lastMeal: dayMeals[0],
    };

    const timeline: MealTimelineItem[] = MEAL_TYPES.slice(0, 6).map((mealType) => {
      const logged = dayMeals.find((meal) => meal.mealType === mealType.id);
      if (!logged) {
        return { id: mealType.id, label: mealType.label, logged: false };
      }

      return {
        id: logged.id,
        label: logged.mealName ?? mealType.label,
        time: formatTime(logged.submittedAt),
        items: logged.items?.map((item) => item.label),
        logged: true,
        calories: logged.totalNutrition?.caloriesKcal,
        status: logged.status,
      };
    });

    return { dashboard, timeline, displayName: profile?.displayName ?? 'there' };
  }, [meals, profile, selectedDate, waterMl]);
}
