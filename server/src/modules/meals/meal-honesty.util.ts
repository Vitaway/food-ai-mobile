import {
  estimateRangeFromMid,
  resolveBalancedPlateForMeal,
  type BalancedPlateScore,
  type EstimateRange,
  type MealLogSource,
} from "./balanced-plate";
import { ensurePlateGroup } from "./plate-group.util";
import type { DetectedFoodItem } from "./nutrition.util";
import { asDetectedItems, sumNutrition } from "./nutrition.util";

const LOG_SOURCES = new Set<MealLogSource>([
  "photo",
  "voice",
  "search",
  "repeat",
  "barcode",
  "text",
]);

export function parseMealLogSource(raw: unknown, fallback: MealLogSource = "photo"): MealLogSource {
  if (typeof raw === "string" && LOG_SOURCES.has(raw as MealLogSource)) {
    return raw as MealLogSource;
  }
  return fallback;
}

/** Ensure every item has a plateGroup (heuristic if missing). */
export function withPlateGroups(items: DetectedFoodItem[]): DetectedFoodItem[] {
  return items.map((item) => ({
    ...item,
    plateGroup: ensurePlateGroup(item),
  }));
}

export function attachMealHonesty(opts: {
  items: DetectedFoodItem[];
  mealType?: string | null;
  logSource?: MealLogSource | null;
  /** Grace-confirmed meals have no estimate band. */
  confirmed?: boolean;
  totalCalories?: number;
}): {
  items: DetectedFoodItem[];
  balancedPlate: BalancedPlateScore | null;
  estimateRange: EstimateRange | null;
} {
  const items = withPlateGroups(opts.items);
  const balancedPlate = resolveBalancedPlateForMeal({
    mealType: opts.mealType,
    items,
  });
  const mid =
    opts.totalCalories ??
    sumNutrition(items).caloriesKcal;
  const estimateRange =
    opts.confirmed || !opts.logSource
      ? null
      : estimateRangeFromMid(mid, opts.logSource);

  return { items, balancedPlate, estimateRange };
}

/** Read honesty fields already stored on meal.data, or recompute. */
export function honestyFromMealData(
  data: Record<string, unknown>,
  opts: { mealType: string; status: string },
) {
  const items = withPlateGroups(asDetectedItems(data.items));
  const logSource = parseMealLogSource(data.logSource, "photo");
  const confirmed = opts.status === "approved";
  const storedPlate = data.balancedPlate;
  const storedRange = data.estimateRange;

  const recomputed = attachMealHonesty({
    items,
    mealType: opts.mealType,
    logSource,
    confirmed,
  });

  return {
    items: recomputed.items,
    logSource,
    balancedPlate:
      confirmed || !items.length
        ? recomputed.balancedPlate
        : (storedPlate as BalancedPlateScore | null | undefined) ?? recomputed.balancedPlate,
    estimateRange: confirmed
      ? null
      : (storedRange as EstimateRange | null | undefined) ?? recomputed.estimateRange,
  };
}
