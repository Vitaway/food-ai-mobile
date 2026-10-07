import type { DetectedFoodItem } from "./nutrition.util";
import { scaleItemNutrition, sumNutrition } from "./nutrition.util";
import {
  estimateRangeFromMid,
  resolveBalancedPlateForMeal,
  type EstimateRange,
  type BalancedPlateScore,
  type MealLogSource,
} from "./balanced-plate";

export type MealPortionsResult = {
  items: DetectedFoodItem[];
  totalNutrition: ReturnType<typeof sumNutrition>;
  totalWeightG: number;
  balancedPlate: BalancedPlateScore | null;
  estimateRange: EstimateRange | null;
};

/**
 * Pure portion recalc used by preview + PATCH (Phase 2 wires HTTP).
 * Scales each item from its current nutrition density when only grams change.
 */
export function recalculateMealPortions(opts: {
  items: DetectedFoodItem[];
  updates: Array<{ id: string; estimatedWeightG: number }>;
  mealType?: string | null;
  logSource?: MealLogSource | null;
  /** When true (Grace confirmed), omit estimate range. */
  confirmed?: boolean;
}): MealPortionsResult {
  const byId = new Map(opts.updates.map((u) => [u.id, u.estimatedWeightG]));
  const items = opts.items.map((item) => {
    const nextG = byId.get(item.id);
    if (nextG === undefined || nextG === item.estimatedWeightG) return item;
    return scaleItemNutrition(item, nextG);
  });

  const totalNutrition = sumNutrition(items);
  const totalWeightG = items.reduce((sum, item) => sum + (item.estimatedWeightG ?? 0), 0);
  const balancedPlate = resolveBalancedPlateForMeal({
    mealType: opts.mealType,
    items: items.map((item) => ({
      estimatedWeightG: item.estimatedWeightG,
      plateGroup: item.plateGroup,
    })),
  });

  const estimateRange =
    opts.confirmed || !opts.logSource
      ? null
      : estimateRangeFromMid(totalNutrition.caloriesKcal, opts.logSource);

  return { items, totalNutrition, totalWeightG, balancedPlate, estimateRange };
}
