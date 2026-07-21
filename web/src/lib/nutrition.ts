import type { DetectedFoodItem, NutritionFacts } from '@/types';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function nutritionFromPer100g(per100g: NutritionFacts, weightG: number): NutritionFacts {
  const factor = Math.max(0, weightG) / 100;
  return {
    caloriesKcal: Math.round((per100g.caloriesKcal ?? 0) * factor),
    proteinG: round1((per100g.proteinG ?? 0) * factor),
    carbsG: round1((per100g.carbsG ?? 0) * factor),
    fatG: round1((per100g.fatG ?? 0) * factor),
    fiberG: round1((per100g.fiberG ?? 0) * factor),
    sugarG: per100g.sugarG != null ? round1(per100g.sugarG * factor) : undefined,
    sodiumMg: per100g.sodiumMg != null ? Math.round(per100g.sodiumMg * factor) : undefined,
  };
}

export function scaleItemNutrition(item: DetectedFoodItem, newWeightG: number): DetectedFoodItem {
  if (item.nutritionPer100g) {
    return {
      ...item,
      estimatedWeightG: newWeightG,
      nutrition: nutritionFromPer100g(item.nutritionPer100g, newWeightG),
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
      proteinG: round1((n.proteinG ?? 0) * ratio),
      carbsG: round1((n.carbsG ?? 0) * ratio),
      fatG: round1((n.fatG ?? 0) * ratio),
      fiberG: round1((n.fiberG ?? 0) * ratio),
      sugarG: n.sugarG != null ? round1(n.sugarG * ratio) : undefined,
      sodiumMg: n.sodiumMg != null ? Math.round(n.sodiumMg * ratio) : undefined,
    },
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
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

export function newIngredient(label = ''): DetectedFoodItem {
  return {
    id: `coach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    confidence: 1,
    estimatedWeightG: 100,
    servingUnit: 'g',
    servingAmount: 100,
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
