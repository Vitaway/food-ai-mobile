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
  return computeNutrientAdequacy(fiberG, fiberTargetG, mealItems).score;
}

export function computeNutrientAdequacy(
  fiberG: number,
  fiberTargetG: number,
  mealItems: DetectedFoodItem[],
) {
  const parts: number[] = [ratioScore(fiberG, fiberTargetG)];
  const consumed = aggregateMicronutrientsFromItems(mealItems);
  let availableNutrients = 1; // Fiber is present in every normalized nutrition record.

  for (const [key, target] of Object.entries(DAILY_MICRONUTRIENT_TARGETS)) {
    if (Object.prototype.hasOwnProperty.call(consumed, key)) {
      availableNutrients += 1;
      parts.push(ratioScore(consumed[key] ?? 0, target));
    }
  }

  const totalNutrients = 1 + Object.keys(DAILY_MICRONUTRIENT_TARGETS).length;
  const dataCoverage = availableNutrients / totalNutrients;
  const measuredScore =
    parts.length && !(parts.length === 1 && fiberG <= 0)
      ? boundedScore(parts.reduce((sum, score) => sum + score, 0) / parts.length)
      : 0;

  // Missing micronutrient data must not silently look like perfect adequacy.
  // Keep half the measured score and earn the remainder through data coverage.
  return {
    score: boundedScore(measuredScore * (0.5 + dataCoverage * 0.5)),
    dataCoverage: Math.round(dataCoverage * 100),
  };
}
