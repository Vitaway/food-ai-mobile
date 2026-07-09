import type { DetectedFoodItem, NutritionFacts } from '@/types';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function scaleItemNutrition(item: DetectedFoodItem, newWeightG: number): DetectedFoodItem {
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

export function newIngredient(label = 'Ingredient'): DetectedFoodItem {
  return {
    id: `coach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    confidence: 1,
    estimatedWeightG: 100,
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
