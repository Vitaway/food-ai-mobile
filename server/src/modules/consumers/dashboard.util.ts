import type { MealSubmission } from "../meals/meal-submission.entity";
import type { MealCoachReview } from "../meals/meal-coach-review.entity";
import { asDetectedItems, sumNutrition, type DetectedFoodItem } from "../meals/nutrition.util";
import { computeNutrientAdequacyScore } from "./nutrient-score.util";

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

function itemsForApprovedMeal(
  meal: MealSubmission,
  reviewsByMealId?: Map<string, MealCoachReview>,
): DetectedFoodItem[] {
  const review = reviewsByMealId?.get(meal.id);
  if (review?.action === "approve" && review.items) {
    return asDetectedItems(review.items);
  }
  return asDetectedItems(meal.data.items);
}

function nutritionForApprovedMeal(
  meal: MealSubmission,
  reviewsByMealId?: Map<string, MealCoachReview>,
) {
  const review = reviewsByMealId?.get(meal.id);
  if (review?.action === "approve") {
    if (review.totalNutrition) return review.totalNutrition;
    const items = review.items ? asDetectedItems(review.items) : [];
    if (items.length) return sumNutrition(items);
  }
  return meal.data.totalNutrition as Record<string, number> | undefined;
}

function boundedScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ratioScore(actual: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const ratio = actual / target;
  if (ratio <= 1) return boundedScore(ratio * 100);
  const overPenalty = Math.max(0, ratio - 1) * 35;
  return boundedScore(100 - overPenalty);
}

export function computeDashboard(
  profile: Record<string, unknown>,
  dashboardCache: Record<string, unknown>,
  meals: MealSubmission[],
  reviewsByMealId?: Map<string, MealCoachReview>,
  date = todayKey(),
) {
  const macroTargets = (profile.macroTargets as Record<string, number>) ?? DEFAULT_MACRO_TARGETS;
  const approvedToday = meals.filter(
    (m) => m.status === "approved" && m.submittedAt.toISOString().slice(0, 10) === date,
  );

  let caloriesConsumed = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;
  const allItems: DetectedFoodItem[] = [];

  for (const meal of approvedToday) {
    const nutrition = nutritionForApprovedMeal(meal, reviewsByMealId);
    if (!nutrition) continue;
    caloriesConsumed += nutrition.caloriesKcal ?? 0;
    proteinG += nutrition.proteinG ?? 0;
    carbsG += nutrition.carbsG ?? 0;
    fatG += nutrition.fatG ?? 0;
    fiberG += nutrition.fiberG ?? 0;
    allItems.push(...itemsForApprovedMeal(meal, reviewsByMealId));
  }

  const waterMl = Number(dashboardCache.waterMl ?? 0);
  const waterTargetMl = Number(profile.waterTargetMl ?? 2000);
  const calorieTarget = Number(macroTargets.calories ?? DEFAULT_MACRO_TARGETS.calories);
  const mealConsistencyTarget = Math.max(1, Number(profile.mealsPerDay ?? 3));
  const nutrientScore = computeNutrientAdequacyScore(
    fiberG,
    Number(macroTargets.fiberG ?? DEFAULT_MACRO_TARGETS.fiberG),
    allItems,
  );
  const macroParts = [
    ratioScore(proteinG, Number(macroTargets.proteinG ?? DEFAULT_MACRO_TARGETS.proteinG)),
    ratioScore(carbsG, Number(macroTargets.carbsG ?? DEFAULT_MACRO_TARGETS.carbsG)),
    ratioScore(fatG, Number(macroTargets.fatG ?? DEFAULT_MACRO_TARGETS.fatG)),
  ];
  const macroScore = boundedScore(macroParts.reduce((sum, score) => sum + score, 0) / macroParts.length);
  const calorieScore = ratioScore(caloriesConsumed, calorieTarget);
  const consistencyScore = boundedScore((approvedToday.length / mealConsistencyTarget) * 100);
  const distinctMeals = new Set(
    approvedToday.map((meal) => String((meal.data.mealName as string | undefined) ?? meal.mealType).toLowerCase()),
  ).size;
  const varietyScore = boundedScore((distinctMeals / Math.max(3, mealConsistencyTarget)) * 100);
  const healthScore = Math.round(
    nutrientScore * 0.3 +
      macroScore * 0.25 +
      calorieScore * 0.2 +
      consistencyScore * 0.15 +
      varietyScore * 0.1,
  );

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
    healthScoreBreakdown: {
      nutrientScore: Math.round(nutrientScore),
      macroScore: Math.round(macroScore),
      calorieScore: Math.round(calorieScore),
      consistencyScore: Math.round(consistencyScore),
      varietyScore: Math.round(varietyScore),
    },
    streakDays: Number(dashboardCache.streakDays ?? 0),
  };
}
