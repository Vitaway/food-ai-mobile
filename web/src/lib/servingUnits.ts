import type { DetectedFoodItem } from '@/types';
import { scaleItemNutrition } from '@/lib/nutrition';

/** Practical East African catalog — aligned with server `serving-units.util.ts`. */
export const MANUAL_SERVING_UNITS = [
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
  'strip',
  'section',
  'leaf',
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

export const SERVING_UNIT_LABELS: Record<string, string> = {
  g: 'g (gram)',
  kg: 'kg (kilogram)',
  ml: 'ml (milliliter)',
  l: 'l (liter)',
  cup: 'cup',
  tbsp: 'tbsp (tablespoon)',
  tsp: 'tsp (teaspoon)',
  glass: 'glass',
  bowl: 'bowl',
  plate: 'plate',
  piece: 'piece',
  slice: 'slice',
  strip: 'strip',
  section: 'section',
  leaf: 'leaf',
  serving: 'serving',
  portion: 'portion',
  scoop: 'scoop',
  handful: 'handful',
  bottle: 'bottle',
  can: 'can',
  carton: 'carton',
  jar: 'jar',
  packet: 'packet',
  sachet: 'sachet',
};

export const DEFAULT_GRAMS_PER_UNIT: Record<string, number> = {
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
  strip: 30,
  section: 25,
  leaf: 10,
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

export type FoodServingOption = {
  unit: string;
  amount: number;
  gramsEquivalent: number;
  isDefault?: boolean;
};

export function servingUnitLabel(unit: string): string {
  const key = unit.trim().toLowerCase();
  return SERVING_UNIT_LABELS[key] ?? unit;
}

const ALLOWED = new Set<string>(MANUAL_SERVING_UNITS);

/** Keep only practical units; map leftovers (ear, drumstick, …) to piece. */
export function coerceServingUnit(unit: string | null | undefined): string {
  const key = (unit ?? 'g').trim().toLowerCase();
  if (ALLOWED.has(key)) return key;
  if (key === 'each' || key === 'pcs' || key === 'pc' || key === 'unit' || key === 'units') {
    return 'piece';
  }
  if (key === 'leave' || key === 'leaves') return 'leaf';
  if (key === 'sections' || key === 'segment' || key === 'segments') return 'section';
  if (key === 'strips' || key === 'finger' || key === 'fingers') return 'strip';
  return 'piece';
}

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
