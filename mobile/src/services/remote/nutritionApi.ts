import { apiRequest } from '@/lib/apiClient';
import type { DetectedFoodItem, MealAnalysisPreview, NutritionFacts } from '@/types';
import { createId } from '@/utils/dates';

export type NutritionFoodLookup = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  nutritionPer100g: Record<string, number>;
  micronutrients: Record<string, number>;
  servings: Array<{ id: string; unit: string; amount: number; gramsEquivalent: number; isDefault: boolean }>;
};

export async function lookupNutritionBarcode(code: string): Promise<NutritionFoodLookup | null> {
  return apiRequest<NutritionFoodLookup | null>(`/nutrition-db/barcode/${encodeURIComponent(code.trim())}`);
}

function scaleNutrition(per100g: Record<string, number>, grams: number): NutritionFacts {
  const factor = grams / 100;
  return {
    caloriesKcal: Math.round((per100g.caloriesKcal ?? 0) * factor),
    proteinG: Math.round((per100g.proteinG ?? 0) * factor * 10) / 10,
    carbsG: Math.round((per100g.carbsG ?? 0) * factor * 10) / 10,
    fatG: Math.round((per100g.fatG ?? 0) * factor * 10) / 10,
    fiberG: Math.round((per100g.fiberG ?? 0) * factor * 10) / 10,
  };
}

export function mealAnalysisFromNutritionFood(food: NutritionFoodLookup): MealAnalysisPreview {
  const serving = food.servings.find((row) => row.isDefault) ?? food.servings[0];
  const grams = serving?.gramsEquivalent ?? 100;
  const nutrition = scaleNutrition(food.nutritionPer100g, grams);

  const item: DetectedFoodItem = {
    id: createId('food'),
    label: food.brand ? `${food.name} (${food.brand})` : food.name,
    confidence: 1,
    estimatedWeightG: grams,
    servingUnit: serving?.unit ?? 'g',
    servingAmount: serving?.amount ?? 1,
    servingGramsEquivalent: grams,
    nutritionFoodId: food.id,
    micronutrients: food.micronutrients,
    nutrition,
  };

  return {
    mealName: food.name,
    items: [item],
    totalNutrition: nutrition,
    totalWeightG: grams,
    confidenceAvg: 1,
    petals: [],
    healthFlag: 'green',
    healthMessage: 'Matched from nutrition database barcode scan.',
  };
}
