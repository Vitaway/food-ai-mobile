import type { MealSubmission } from "../meals/meal-submission.entity";

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_MACRO_TARGETS = {
  calories: 2000,
  proteinG: 120,
  carbsG: 200,
  fatG: 65,
  fiberG: 25,
};

export function computeDashboard(
  profile: Record<string, unknown>,
  dashboardCache: Record<string, unknown>,
  meals: MealSubmission[],
) {
  const date = todayKey();
  const macroTargets = (profile.macroTargets as Record<string, number>) ?? DEFAULT_MACRO_TARGETS;
  const approvedToday = meals.filter(
    (m) => m.status === "approved" && m.submittedAt.toISOString().slice(0, 10) === date,
  );

  let caloriesConsumed = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;

  for (const meal of approvedToday) {
    const nutrition = meal.data.totalNutrition as Record<string, number> | undefined;
    if (!nutrition) continue;
    caloriesConsumed += nutrition.caloriesKcal ?? 0;
    proteinG += nutrition.proteinG ?? 0;
    carbsG += nutrition.carbsG ?? 0;
    fatG += nutrition.fatG ?? 0;
    fiberG += nutrition.fiberG ?? 0;
  }

  const waterMl = Number(dashboardCache.waterMl ?? 0);
  const waterTargetMl = Number(profile.waterTargetMl ?? 2000);
  const calorieTarget = Number(macroTargets.calories ?? DEFAULT_MACRO_TARGETS.calories);
  const healthScore =
    calorieTarget > 0 ? Math.min(100, Math.round((caloriesConsumed / calorieTarget) * 100)) : 0;

  return {
    date,
    caloriesConsumed: Math.round(caloriesConsumed),
    calorieTarget,
    macrosConsumed: {
      proteinG: Math.round(proteinG),
      carbsG: Math.round(carbsG),
      fatG: Math.round(fatG),
      fiberG: Math.round(fiberG),
    },
    waterMl,
    waterTargetMl,
    healthScore,
    streakDays: Number(dashboardCache.streakDays ?? 0),
  };
}
