import { apiRequest } from '@/lib/apiClient';
import type { DetectedFoodItem, HealthFlagLevel, MealAnalysisPreview, NutritionFacts } from '@/types';
import { createId } from '@/utils/dates';

export type NutritionFoodServing = {
  id: string;
  unit: string;
  amount: number;
  gramsEquivalent: number;
  isDefault: boolean;
};

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
  servings: NutritionFoodServing[];
};

export type BarcodeCartItem = {
  key: string;
  food: NutritionFoodLookup;
  barcode: string;
};

export type BarcodePortionMultiplier = 0.5 | 1 | 2;

export type BarcodePortionState = {
  key: string;
  food: NutritionFoodLookup;
  barcode: string;
  servingId: string | null;
  multiplier: BarcodePortionMultiplier;
  grams: number;
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

export function defaultServingForFood(food: NutritionFoodLookup): NutritionFoodServing | null {
  return food.servings.find((row) => row.isDefault) ?? food.servings[0] ?? null;
}

export function cartKeyForFood(food: NutritionFoodLookup, barcode?: string): string {
  return food.id || barcode || food.barcode || createId('food');
}

export function initialPortionState(item: BarcodeCartItem): BarcodePortionState {
  const serving = defaultServingForFood(item.food);
  const baseGrams = serving?.gramsEquivalent ?? 100;
  return {
    key: item.key,
    food: item.food,
    barcode: item.barcode,
    servingId: serving?.id ?? null,
    multiplier: 1,
    grams: Math.max(1, Math.round(baseGrams)),
  };
}

export function resolvePortionGrams(
  food: NutritionFoodLookup,
  servingId: string | null,
  multiplier: BarcodePortionMultiplier,
): number {
  const serving =
    (servingId ? food.servings.find((row) => row.id === servingId) : null) ??
    defaultServingForFood(food);
  const base = serving?.gramsEquivalent ?? 100;
  return Math.max(1, Math.round(base * multiplier));
}

export function servingsForPortion(food: NutritionFoodLookup, grams: number): NutritionFoodServing[] {
  if (food.servings.length) return food.servings;
  return [
    {
      id: 'default-g',
      unit: 'g',
      amount: grams,
      gramsEquivalent: grams,
      isDefault: true,
    },
  ];
}

export function activeServingForPortion(portion: BarcodePortionState): NutritionFoodServing {
  const servings = servingsForPortion(portion.food, portion.grams);
  return (
    servings.find((row) => row.id === portion.servingId) ??
    defaultServingForFood(portion.food) ??
    servings[0]!
  );
}

export function gramsPerDeclaredUnit(serving: NutritionFoodServing): number {
  return serving.gramsEquivalent / Math.max(serving.amount, 0.01);
}

export function portionAmountInUnit(portion: BarcodePortionState): { amount: number; unit: string } {
  const serving = activeServingForPortion(portion);
  return {
    amount: portion.grams / gramsPerDeclaredUnit(serving),
    unit: serving.unit,
  };
}

export function mergeCartIntoPortions(
  existing: BarcodePortionState[],
  cart: BarcodeCartItem[],
): BarcodePortionState[] {
  const previous = new Map(existing.map((row) => [row.key, row]));
  return cart.map((item) => previous.get(item.key) ?? initialPortionState(item));
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

function sumNutrition(rows: NutritionFacts[]): NutritionFacts {
  return rows.reduce(
    (acc, row) => ({
      caloriesKcal: acc.caloriesKcal + row.caloriesKcal,
      proteinG: Math.round((acc.proteinG + row.proteinG) * 10) / 10,
      carbsG: Math.round((acc.carbsG + row.carbsG) * 10) / 10,
      fatG: Math.round((acc.fatG + row.fatG) * 10) / 10,
      fiberG: Math.round((acc.fiberG + (row.fiberG ?? 0)) * 10) / 10,
      sugarG: Math.round(((acc.sugarG ?? 0) + (row.sugarG ?? 0)) * 10) / 10,
      sodiumMg: (acc.sodiumMg ?? 0) + (row.sodiumMg ?? 0),
    }),
    {
      caloriesKcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
      sodiumMg: 0,
    },
  );
}

function healthFromPackagedProducts(
  foods: NutritionFoodLookup[],
): { flag: HealthFlagLevel; message: string } {
  if (foods.length === 0) {
    return { flag: 'yellow', message: 'Packaged products logged from label data.' };
  }
  if (foods.length === 1) {
    return healthFromPackagedProduct(foods[0]!);
  }
  const grades = foods
    .map((f) => f.nutriscoreGrade?.toLowerCase())
    .filter((g): g is string => Boolean(g));
  const worst = grades.sort().reverse()[0];
  const names = foods.map((f) => f.name).slice(0, 3).join(', ');
  const extra = foods.length > 3 ? ` +${foods.length - 3} more` : '';
  if (worst === 'e' || worst === 'd') {
    return {
      flag: worst === 'e' ? 'red' : 'orange',
      message: `${foods.length} packaged items (${names}${extra}). Nutrition from label data.`,
    };
  }
  if (worst === 'c') {
    return {
      flag: 'yellow',
      message: `${foods.length} packaged items (${names}${extra}). Nutrition from label data.`,
    };
  }
  return {
    flag: grades.length ? 'green' : 'yellow',
    message: `${foods.length} packaged items (${names}${extra}). Nutrition from label data.`,
  };
}

function healthFromPackagedProduct(food: NutritionFoodLookup): { flag: HealthFlagLevel; message: string } {
  const grade = food.nutriscoreGrade?.toLowerCase();
  const brand = food.brand ? ` (${food.brand})` : '';
  const serving = defaultServingForFood(food);
  const servingLabel = serving ? `${serving.amount} ${serving.unit}` : '100 g';

  if (grade === 'a' || grade === 'b') {
    return {
      flag: 'green',
      message: `Nutri-Score ${grade.toUpperCase()} — ${food.name}${brand}. ${servingLabel} serving from Open Food Facts.`,
    };
  }
  if (grade === 'c') {
    return {
      flag: 'yellow',
      message: `Nutri-Score C — ${food.name}${brand}. ${servingLabel} serving logged from Open Food Facts.`,
    };
  }
  if (grade === 'd') {
    return {
      flag: 'orange',
      message: `Nutri-Score D — ${food.name}${brand}. ${servingLabel} serving logged from Open Food Facts.`,
    };
  }
  if (grade === 'e') {
    return {
      flag: 'red',
      message: `Nutri-Score E — ${food.name}${brand}. ${servingLabel} serving logged from Open Food Facts.`,
    };
  }

  return {
    flag: 'yellow',
    message: `Packaged product${brand} — ${servingLabel} serving calculated from Open Food Facts per 100g data.`,
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

export function buildBarcodeCartNote(
  portions: Array<{ food: NutritionFoodLookup; barcode: string; grams: number; multiplier: number }>,
): string {
  if (portions.length === 1) {
    const row = portions[0]!;
    const base = buildBarcodeMealNote(row.food, row.barcode);
    return `Amount: ${row.grams}g (${row.multiplier}× serving). ${base}`;
  }
  const lines = portions.map((row, index) => {
    const brand = row.food.brand ? ` (${row.food.brand})` : '';
    return `${index + 1}. ${row.food.name}${brand} — ${row.grams}g (${row.multiplier}×), barcode ${row.barcode}.`;
  });
  return `Barcode meal (${portions.length} items). ${lines.join(' ')} Nutrition calculated from Open Food Facts label data.`;
}

export function detectedItemFromNutritionFood(
  food: NutritionFoodLookup,
  grams: number,
  serving?: NutritionFoodServing | null,
): DetectedFoodItem {
  const resolvedServing = serving ?? defaultServingForFood(food);
  const nutrition = scaleNutrition(food.nutritionPer100g, grams);
  return {
    id: createId('food'),
    label: food.brand ? `${food.name} (${food.brand})` : food.name,
    confidence: 1,
    estimatedWeightG: grams,
    servingUnit: resolvedServing?.unit ?? 'g',
    servingAmount: resolvedServing ? resolvedServing.amount * (grams / Math.max(1, resolvedServing.gramsEquivalent)) : grams,
    servingGramsEquivalent: grams,
    nutritionFoodId: food.id,
    micronutrients: food.micronutrients,
    imageUrl: food.imageUrl ?? undefined,
    nutrition,
  };
}

export function mealAnalysisFromNutritionFood(food: NutritionFoodLookup): MealAnalysisPreview {
  const serving = defaultServingForFood(food);
  const grams = serving?.gramsEquivalent ?? 100;
  return mealAnalysisFromPortions([
    {
      food,
      grams,
      serving,
    },
  ]);
}

export function mealAnalysisFromPortions(
  portions: Array<{
    food: NutritionFoodLookup;
    grams: number;
    serving?: NutritionFoodServing | null;
  }>,
): MealAnalysisPreview {
  const items = portions.map((row) => detectedItemFromNutritionFood(row.food, row.grams, row.serving));
  const totalNutrition = sumNutrition(items.map((item) => item.nutrition));
  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const health = healthFromPackagedProducts(portions.map((row) => row.food));
  const mealName =
    portions.length === 1
      ? portions[0]!.food.name
      : portions.length <= 2
        ? portions.map((row) => row.food.name).join(' + ')
        : `${portions[0]!.food.name} + ${portions.length - 1} more`;

  return {
    mealName,
    items,
    totalNutrition,
    totalWeightG,
    confidenceAvg: 1,
    petals: [],
    healthFlag: health.flag,
    healthMessage: health.message,
  };
}
