import type { DetectedFoodItem, MealPetal, MealSubmission, NutritionFacts } from '@/types';

/** Cap nutrition values at 2 decimal places. */
export function roundNutrition(n: number, maxDecimals = 2) {
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** Math.max(0, Math.min(2, maxDecimals));
  return Math.round(n * factor) / factor;
}

export function sumItemNutrition(items: DetectedFoodItem[]): NutritionFacts {
  return items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + item.nutrition.caloriesKcal,
      proteinG: acc.proteinG + item.nutrition.proteinG,
      carbsG: acc.carbsG + item.nutrition.carbsG,
      fatG: acc.fatG + item.nutrition.fatG,
      fiberG: acc.fiberG + item.nutrition.fiberG,
      sugarG: (acc.sugarG ?? 0) + (item.nutrition.sugarG ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (item.nutrition.sodiumMg ?? 0),
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 },
  );
}

export function buildPetals(items: DetectedFoodItem[]): MealPetal[] {
  const totalWeight = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  if (totalWeight <= 0) return [];

  return items.map((item) => ({
    label: item.label,
    percent: Math.round((item.estimatedWeightG / totalWeight) * 100),
    color: '#50af73',
  }));
}

export function scaleItemWeight(item: DetectedFoodItem, newWeightG: number): DetectedFoodItem {
  const weight = Math.max(1, Math.round(newWeightG));
  const previous = item.estimatedWeightG > 0 ? item.estimatedWeightG : 1;
  const factor = weight / previous;
  const n = item.nutrition;

  return {
    ...item,
    label: item.label.trim() || 'Item',
    estimatedWeightG: weight,
    nutrition: {
      caloriesKcal: Math.max(0, Math.round(n.caloriesKcal * factor)),
      proteinG: roundNutrition(n.proteinG * factor),
      carbsG: roundNutrition(n.carbsG * factor),
      fatG: roundNutrition(n.fatG * factor),
      fiberG: roundNutrition(n.fiberG * factor),
      sugarG: roundNutrition((n.sugarG ?? 0) * factor),
      sodiumMg: Math.max(0, Math.round((n.sodiumMg ?? 0) * factor)),
    },
  };
}

export function applyMealItems(meal: MealSubmission, items: DetectedFoodItem[]): MealSubmission {
  const totalNutrition = sumItemNutrition(items);
  const petals = buildPetals(items);

  return {
    ...meal,
    items,
    totalNutrition,
    petals,
    mealName: items.length ? items.map((item) => item.label).join(', ') : meal.mealName,
  };
}
