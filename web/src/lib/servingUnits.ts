import type { DetectedFoodItem } from '@/types';
import { scaleItemNutrition } from '@/lib/nutrition';

/** Fallback units when food DB list is unavailable or for manual entries. */
export const MANUAL_SERVING_UNITS = [
  'g',
  'ml',
  'piece',
  'slice',
  'cup',
  'tbsp',
  'tsp',
  'bowl',
  'plate',
  'bottle',
  'can',
  'carton',
] as const;

export const DEFAULT_GRAMS_PER_UNIT: Record<string, number> = {
  g: 1,
  ml: 1,
  piece: 85,
  slice: 30,
  cup: 175,
  tbsp: 15,
  tsp: 5,
  bowl: 300,
  plate: 400,
  bottle: 330,
  can: 330,
  carton: 250,
};

export type FoodServingOption = {
  unit: string;
  amount: number;
  gramsEquivalent: number;
  isDefault?: boolean;
};

/** Grams for one unit of this serving definition. */
export function gramsPerUnit(serving: FoodServingOption): number {
  const baseAmount = serving.amount > 0 ? serving.amount : 1;
  return serving.gramsEquivalent / baseAmount;
}

export function defaultGramsForUnit(unit: string): number {
  const key = unit.trim().toLowerCase();
  return DEFAULT_GRAMS_PER_UNIT[key] ?? 100;
}

export function weightFromServing(amount: number, gramsEquivalentPerUnit: number): number {
  return Math.round(Math.max(0, amount) * Math.max(0, gramsEquivalentPerUnit) * 100) / 100;
}

/** Apply serving amount/unit as the measurement basis and rescale nutrition. */
export function applyServingMeasure(
  item: DetectedFoodItem,
  next: {
    servingAmount: number;
    servingUnit: string;
    servingGramsEquivalent: number;
  },
): DetectedFoodItem {
  const servingAmount = Math.max(0, next.servingAmount);
  const servingGramsEquivalent = Math.max(0, next.servingGramsEquivalent);
  const estimatedWeightG = weightFromServing(servingAmount, servingGramsEquivalent);
  const scaled = scaleItemNutrition(
    {
      ...item,
      servingAmount,
      servingUnit: next.servingUnit,
      servingGramsEquivalent,
    },
    estimatedWeightG,
  );
  return {
    ...scaled,
    servingAmount,
    servingUnit: next.servingUnit,
    servingGramsEquivalent,
  };
}

export function pickDefaultServing(servings: FoodServingOption[]): FoodServingOption | null {
  if (!servings.length) return null;
  return servings.find((s) => s.isDefault) ?? servings[0] ?? null;
}
