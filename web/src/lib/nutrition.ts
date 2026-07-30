import type { DetectedFoodItem, NutritionFacts } from '@/types';

/** Cap nutrition values at 2 decimal places (kcal/sodium stay integers via callers). */
export function roundNutrition(n: number, maxDecimals = 2) {
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** Math.max(0, Math.min(2, maxDecimals));
  return Math.round(n * factor) / factor;
}

export function nutritionFromPer100g(per100g: NutritionFacts, weightG: number): NutritionFacts {
  const factor = Math.max(0, weightG) / 100;
  return {
    caloriesKcal: Math.round((per100g.caloriesKcal ?? 0) * factor),
    proteinG: roundNutrition((per100g.proteinG ?? 0) * factor),
    carbsG: roundNutrition((per100g.carbsG ?? 0) * factor),
    fatG: roundNutrition((per100g.fatG ?? 0) * factor),
    fiberG: roundNutrition((per100g.fiberG ?? 0) * factor),
    sugarG: per100g.sugarG != null ? roundNutrition(per100g.sugarG * factor) : undefined,
    sodiumMg: per100g.sodiumMg != null ? Math.round(per100g.sodiumMg * factor) : undefined,
  };
}

/** Scale per-100g micronutrients to the given portion weight. */
export function micronutrientsFromPer100g(
  per100g: Record<string, number> | undefined,
  weightG: number,
): Record<string, number> | undefined {
  if (!per100g || !Object.keys(per100g).length) return undefined;
  const factor = Math.max(0, weightG) / 100;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(per100g)) {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) continue;
    out[key] = roundNutrition(n * factor);
  }
  return Object.keys(out).length ? out : undefined;
}

export function scaleItemNutrition(item: DetectedFoodItem, newWeightG: number): DetectedFoodItem {
  if (item.nutritionPer100g) {
    // Prefer food.micronutrients-per-100 stored alongside when rescaling from DB.
    const microsPer100 =
      item.micronutrients && item.estimatedWeightG > 0
        ? Object.fromEntries(
            Object.entries(item.micronutrients).map(([k, v]) => [
              k,
              (Number(v) / item.estimatedWeightG) * 100,
            ]),
          )
        : undefined;
    return {
      ...item,
      estimatedWeightG: newWeightG,
      nutrition: nutritionFromPer100g(item.nutritionPer100g, newWeightG),
      micronutrients: micronutrientsFromPer100g(microsPer100, newWeightG),
    };
  }
  const oldWeight = item.estimatedWeightG > 0 ? item.estimatedWeightG : 1;
  const ratio = newWeightG / oldWeight;
  const n = item.nutrition;
  return {
    ...item,
    estimatedWeightG: newWeightG,
    nutrition: {
      caloriesKcal: Math.round((n.caloriesKcal ?? 0) * ratio),
      proteinG: roundNutrition((n.proteinG ?? 0) * ratio),
      carbsG: roundNutrition((n.carbsG ?? 0) * ratio),
      fatG: roundNutrition((n.fatG ?? 0) * ratio),
      fiberG: roundNutrition((n.fiberG ?? 0) * ratio),
      sugarG: n.sugarG != null ? roundNutrition(n.sugarG * ratio) : undefined,
      sodiumMg: n.sodiumMg != null ? Math.round(n.sodiumMg * ratio) : undefined,
    },
    micronutrients: item.micronutrients
      ? Object.fromEntries(
          Object.entries(item.micronutrients).map(([k, v]) => [k, roundNutrition(Number(v) * ratio)]),
        )
      : undefined,
  };
}

export function sumNutrition(items: DetectedFoodItem[]): NutritionFacts {
  const total: NutritionFacts = {
    caloriesKcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };
  for (const item of items) {
    total.caloriesKcal += item.nutrition.caloriesKcal ?? 0;
    total.proteinG += item.nutrition.proteinG ?? 0;
    total.carbsG += item.nutrition.carbsG ?? 0;
    total.fatG += item.nutrition.fatG ?? 0;
    total.fiberG += item.nutrition.fiberG ?? 0;
  }
  return {
    caloriesKcal: Math.round(total.caloriesKcal),
    proteinG: roundNutrition(total.proteinG),
    carbsG: roundNutrition(total.carbsG),
    fatG: roundNutrition(total.fatG),
    fiberG: roundNutrition(total.fiberG),
  };
}

export function newIngredient(label = ''): DetectedFoodItem {
  return {
    id: `coach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    confidence: 1,
    estimatedWeightG: 1,
    servingUnit: 'g',
    servingAmount: 1,
    servingGramsEquivalent: 1,
    foodSource: 'manual',
    emoji: '🍽️',
    nutrition: {
      caloriesKcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    },
  };
}
