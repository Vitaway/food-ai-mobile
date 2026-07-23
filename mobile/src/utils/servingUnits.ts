import type { DetectedFoodItem, NutritionFacts } from '@/types';

export const SERVING_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'cup',
  'tbsp',
  'tsp',
  'glass',
  'bowl',
  'plate',
  'piece',
  'slice',
  'serving',
  'portion',
  'scoop',
  'handful',
  'bottle',
  'can',
  'carton',
  'jar',
  'packet',
  'sachet',
] as const;

export type ServingUnit = (typeof SERVING_UNITS)[number];

export const DEFAULT_GRAMS_PER_UNIT: Record<ServingUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  cup: 175,
  tbsp: 15,
  tsp: 5,
  glass: 240,
  bowl: 300,
  plate: 400,
  piece: 85,
  slice: 30,
  serving: 100,
  portion: 150,
  scoop: 30,
  handful: 40,
  bottle: 330,
  can: 330,
  carton: 250,
  jar: 200,
  packet: 50,
  sachet: 20,
};

export function normalizeServingUnit(unit: string): ServingUnit {
  const lower = unit.trim().toLowerCase();
  if ((SERVING_UNITS as readonly string[]).includes(lower)) {
    return lower as ServingUnit;
  }
  if (lower === 'gram' || lower === 'grams') return 'g';
  if (lower === 'kilogram' || lower === 'kilograms') return 'kg';
  if (lower === 'milliliter' || lower === 'millilitre' || lower === 'milliliters') return 'ml';
  if (lower === 'liter' || lower === 'litre' || lower === 'liters') return 'l';
  if (lower === 'tablespoon' || lower === 'tablespoons' || lower === 'tbs') return 'tbsp';
  if (lower === 'teaspoon' || lower === 'teaspoons') return 'tsp';
  if (lower === 'pcs' || lower === 'pc' || lower === 'each' || lower === 'unit' || lower === 'units') {
    return 'piece';
  }
  return 'g';
}

export function gramsForServing(unit: string, amount = 1, gramsEquivalent?: number): number {
  const normalized = normalizeServingUnit(unit);
  const perUnit = gramsEquivalent ?? DEFAULT_GRAMS_PER_UNIT[normalized];
  return Math.round(perUnit * amount * 100) / 100;
}

function scaleNutrition(nutrition: NutritionFacts, factor: number): NutritionFacts {
  return {
    caloriesKcal: Math.round(nutrition.caloriesKcal * factor),
    proteinG: Math.round(nutrition.proteinG * factor * 10) / 10,
    carbsG: Math.round(nutrition.carbsG * factor * 10) / 10,
    fatG: Math.round(nutrition.fatG * factor * 10) / 10,
    fiberG: Math.round(nutrition.fiberG * factor * 10) / 10,
    sugarG: nutrition.sugarG != null ? Math.round(nutrition.sugarG * factor * 10) / 10 : undefined,
    sodiumMg: nutrition.sodiumMg != null ? Math.round(nutrition.sodiumMg * factor) : undefined,
  };
}

export function ensureServingFields(item: DetectedFoodItem): DetectedFoodItem {
  const servingUnit = normalizeServingUnit(item.servingUnit ?? 'g');
  const servingAmount = item.servingAmount ?? 1;
  const servingGramsEquivalent =
    item.servingGramsEquivalent ??
    (item.estimatedWeightG > 0 && servingAmount > 0
      ? Math.round((item.estimatedWeightG / servingAmount) * 100) / 100
      : DEFAULT_GRAMS_PER_UNIT[servingUnit]);

  return {
    ...item,
    servingUnit,
    servingAmount,
    servingGramsEquivalent,
  };
}

export function applyServingUnitToItem(
  item: DetectedFoodItem,
  unit: string,
  amount = item.servingAmount ?? 1,
  gramsEquivalent?: number,
): DetectedFoodItem {
  const normalized = normalizeServingUnit(unit);
  const previousUnit = normalizeServingUnit(item.servingUnit ?? 'g');
  const unitChanged = previousUnit !== normalized;
  const perUnitGrams =
    gramsEquivalent ??
    (unitChanged
      ? DEFAULT_GRAMS_PER_UNIT[normalized]
      : item.servingGramsEquivalent ?? DEFAULT_GRAMS_PER_UNIT[normalized]);
  const newWeight = gramsForServing(normalized, amount, perUnitGrams);
  const baseWeight = item.estimatedWeightG > 0 ? item.estimatedWeightG : newWeight;
  const factor = baseWeight > 0 ? newWeight / baseWeight : 1;

  return {
    ...item,
    servingUnit: normalized,
    servingAmount: amount,
    servingGramsEquivalent: perUnitGrams,
    estimatedWeightG: newWeight,
    nutrition: scaleNutrition(item.nutrition, factor),
    micronutrients: item.micronutrients
      ? Object.fromEntries(
          Object.entries(item.micronutrients).map(([key, value]) => [
            key,
            Math.round(value * factor * 10) / 10,
          ]),
        )
      : undefined,
  };
}

export function recalculateAnalysisTotals(items: DetectedFoodItem[]) {
  const totalWeightG = Math.round(items.reduce((sum, item) => sum + item.estimatedWeightG, 0));
  const totalNutrition = items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + item.nutrition.caloriesKcal,
      proteinG: acc.proteinG + item.nutrition.proteinG,
      carbsG: acc.carbsG + item.nutrition.carbsG,
      fatG: acc.fatG + item.nutrition.fatG,
      fiberG: acc.fiberG + item.nutrition.fiberG,
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );

  return {
    totalWeightG,
    totalNutrition: {
      caloriesKcal: Math.round(totalNutrition.caloriesKcal),
      proteinG: Math.round(totalNutrition.proteinG * 10) / 10,
      carbsG: Math.round(totalNutrition.carbsG * 10) / 10,
      fatG: Math.round(totalNutrition.fatG * 10) / 10,
      fiberG: Math.round(totalNutrition.fiberG * 10) / 10,
    },
  };
}
