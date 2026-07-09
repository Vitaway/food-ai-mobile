import type { DetectedFoodItem } from "../meals/nutrition.util";

/** Simplified daily targets for nutrient adequacy scoring (rule-based MVP). */
export const DAILY_MICRONUTRIENT_TARGETS: Record<string, number> = {
  ironMg: 18,
  vitaminCMg: 90,
  calciumMg: 1000,
  vitaminDIu: 600,
  potassiumMg: 3500,
};

function boundedScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function ratioScore(actual: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const ratio = actual / target;
  if (ratio <= 1) return boundedScore(ratio * 100);
  return boundedScore(100 - Math.max(0, ratio - 1) * 35);
}

export function aggregateMicronutrientsFromItems(items: DetectedFoodItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const micros = item.micronutrients ?? {};
    for (const [key, value] of Object.entries(micros)) {
      totals[key] = (totals[key] ?? 0) + (Number(value) || 0);
    }
  }
  return totals;
}

export function computeNutrientAdequacyScore(
  fiberG: number,
  fiberTargetG: number,
  mealItems: DetectedFoodItem[],
): number {
  const parts: number[] = [ratioScore(fiberG, fiberTargetG)];

  const consumed = aggregateMicronutrientsFromItems(mealItems);
  for (const [key, target] of Object.entries(DAILY_MICRONUTRIENT_TARGETS)) {
    if ((consumed[key] ?? 0) > 0) {
      parts.push(ratioScore(consumed[key] ?? 0, target));
    }
  }

  if (parts.length === 1 && fiberG <= 0) return 0;
  return boundedScore(parts.reduce((sum, score) => sum + score, 0) / parts.length);
}
