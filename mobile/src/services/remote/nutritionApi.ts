import { apiRequest } from '@/lib/apiClient';
import type { DetectedFoodItem, HealthFlagLevel, MealAnalysisPreview, NutritionFacts } from '@/types';
import { createId } from '@/utils/dates';

export type NutritionFoodLookup = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  quantity?: string | null;
  ingredientsText?: string | null;
  nutriscoreGrade?: string | null;
  ecoscoreGrade?: string | null;
  novaGroup?: number | null;
  source?: 'local' | 'openfoodfacts';
  nutritionPer100g: Record<string, number>;
  micronutrients: Record<string, number>;
  servings: Array<{ id: string; unit: string; amount: number; gramsEquivalent: number; isDefault: boolean }>;
};

export async function lookupNutritionBarcode(code: string): Promise<NutritionFoodLookup | null> {
  return apiRequest<NutritionFoodLookup | null>(`/nutrition-db/barcode/${encodeURIComponent(code.trim())}`);
}

export async function searchPackagedProducts(query: string): Promise<NutritionFoodLookup[]> {
  const q = query.trim();
  if (!q) return [];
  return apiRequest<NutritionFoodLookup[]>(
    `/nutrition-db/products?q=${encodeURIComponent(q)}&limit=20`,
  );
}

function scaleNutrition(per100g: Record<string, number>, grams: number): NutritionFacts {
  const factor = grams / 100;
  return {
    caloriesKcal: Math.round((per100g.caloriesKcal ?? 0) * factor),
    proteinG: Math.round((per100g.proteinG ?? 0) * factor * 10) / 10,
    carbsG: Math.round((per100g.carbsG ?? 0) * factor * 10) / 10,
    fatG: Math.round((per100g.fatG ?? 0) * factor * 10) / 10,
    fiberG: Math.round((per100g.fiberG ?? 0) * factor * 10) / 10,
    sugarG: Math.round((per100g.sugarG ?? 0) * factor * 10) / 10,
    sodiumMg: Math.round((per100g.sodiumMg ?? 0) * factor),
  };
}

function healthFromPackagedProduct(food: NutritionFoodLookup): { flag: HealthFlagLevel; message: string } {
  const grade = food.nutriscoreGrade?.toLowerCase();
  const brand = food.brand ? ` (${food.brand})` : '';
  const serving = food.servings.find((row) => row.isDefault) ?? food.servings[0];
  const grams = serving?.gramsEquivalent ?? 100;

  if (grade === 'a' || grade === 'b') {
    return {
      flag: 'green',
      message: `Nutri-Score ${grade.toUpperCase()} — ${food.name}${brand}. ${grams}g serving from Open Food Facts.`,
    };
  }
  if (grade === 'c') {
    return {
      flag: 'yellow',
      message: `Nutri-Score C — ${food.name}${brand}. ${grams}g serving logged from Open Food Facts.`,
    };
  }
  if (grade === 'd') {
    return {
      flag: 'orange',
      message: `Nutri-Score D — ${food.name}${brand}. ${grams}g serving logged from Open Food Facts.`,
    };
  }
  if (grade === 'e') {
    return {
      flag: 'red',
      message: `Nutri-Score E — ${food.name}${brand}. ${grams}g serving logged from Open Food Facts.`,
    };
  }

  return {
    flag: 'yellow',
    message: `Packaged product${brand} — ${grams}g serving calculated from Open Food Facts per 100g data.`,
  };
}

export function buildBarcodeMealNote(food: NutritionFoodLookup, barcode: string): string {
  const parts = [
    `Barcode ${barcode}: ${food.name}${food.brand ? ` (${food.brand})` : ''}.`,
    food.quantity ? `Package: ${food.quantity}.` : null,
    food.nutriscoreGrade ? `Nutri-Score ${food.nutriscoreGrade.toUpperCase()}.` : null,
    food.novaGroup ? `NOVA group ${food.novaGroup}.` : null,
    food.ingredientsText ? `Ingredients: ${food.ingredientsText}` : null,
    'Nutrition calculated from Open Food Facts label data.',
  ];
  return parts.filter(Boolean).join(' ');
}

export function mealAnalysisFromNutritionFood(food: NutritionFoodLookup): MealAnalysisPreview {
  const serving = food.servings.find((row) => row.isDefault) ?? food.servings[0];
  const grams = serving?.gramsEquivalent ?? 100;
  const nutrition = scaleNutrition(food.nutritionPer100g, grams);
  const health = healthFromPackagedProduct(food);

  const item: DetectedFoodItem = {
    id: createId('food'),
    label: food.brand ? `${food.name} (${food.brand})` : food.name,
    confidence: 1,
    estimatedWeightG: grams,
    servingUnit: serving?.unit ?? 'g',
    servingAmount: serving?.amount ?? grams,
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
    healthFlag: health.flag,
    healthMessage: health.message,
  };
}
