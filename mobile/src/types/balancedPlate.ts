/**
 * Phase 0 contracts — Balanced Plate, estimate honesty, portion edits.
 * Formula matches MiraFood-Prototype_2.html (plateScore + RANGE).
 */

/** Half vegetables/fruit · quarter protein · quarter starch. */
export type PlateGroup = 'vf' | 'pr' | 'st' | 'other';

export type BalancedPlateLabel = 'Balanced' | 'Good, one tweak' | 'Needs a tweak';

export type PlateGroupShares = {
  vf: number;
  pr: number;
  st: number;
};

export type BalancedPlateScore = {
  /** 0–100. */
  score: number;
  shares: PlateGroupShares;
  label: BalancedPlateLabel;
  tip: string;
};

/**
 * How the meal entered the log — drives estimate ± range.
 * `text` is describe-without-photo (same honesty as search).
 */
export type MealLogSource = 'photo' | 'voice' | 'search' | 'repeat' | 'barcode' | 'text';

/** Mid-point kcal with an honest low–high band until Grace confirms. */
export type EstimateRange = {
  midKcal: number;
  lowKcal: number;
  highKcal: number;
  /** Fractional uncertainty, e.g. 0.15 = ±15%. */
  pct: number;
  source: MealLogSource;
};

/** Prototype RANGE map. */
export const ESTIMATE_RANGE_PCT: Record<MealLogSource, number> = {
  photo: 0.15,
  voice: 0.2,
  search: 0.1,
  repeat: 0.1,
  barcode: 0,
  text: 0.1,
};

export const PLATE_GROUP_AIM: PlateGroupShares = {
  vf: 0.5,
  pr: 0.25,
  st: 0.25,
};

export const PLATE_GROUP_LABELS: Record<'vf' | 'pr' | 'st', string> = {
  vf: 'Vegetables and fruit',
  pr: 'Protein',
  st: 'Starch',
};

/** Lunch / dinner only — breakfast & snacks count toward the day without a plate score. */
export function mealTypeSupportsBalancedPlate(mealType: string | null | undefined): boolean {
  if (!mealType) return false;
  const key = mealType.toLowerCase();
  return key === 'lunch' || key === 'dinner';
}

export function estimateRangeFromMid(
  midKcal: number,
  source: MealLogSource,
): EstimateRange {
  const pct = ESTIMATE_RANGE_PCT[source] ?? 0.15;
  const mid = Math.max(0, Math.round(midKcal));
  if (pct <= 0) {
    return { midKcal: mid, lowKcal: mid, highKcal: mid, pct: 0, source };
  }
  return {
    midKcal: mid,
    lowKcal: Math.max(0, Math.round(mid * (1 - pct))),
    highKcal: Math.max(0, Math.round(mid * (1 + pct))),
    pct,
    source,
  };
}

export type PlateScoreItem = {
  estimatedWeightG: number;
  plateGroup?: PlateGroup | null;
};

/**
 * Weight-share score vs ideal 50/25/25.
 * Returns null when no vf/pr/st grams (nothing to score).
 */
export function computeBalancedPlateScore(items: PlateScoreItem[]): BalancedPlateScore | null {
  const scored = items.filter((item) => {
    const g = item.plateGroup;
    return (g === 'vf' || g === 'pr' || g === 'st') && item.estimatedWeightG > 0;
  });
  const totalG = scored.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  if (totalG <= 0) return null;

  const shares: PlateGroupShares = { vf: 0, pr: 0, st: 0 };
  for (const item of scored) {
    const g = item.plateGroup as 'vf' | 'pr' | 'st';
    shares[g] += item.estimatedWeightG / totalG;
  }

  const deviation =
    Math.abs(shares.vf - PLATE_GROUP_AIM.vf) +
    Math.abs(shares.pr - PLATE_GROUP_AIM.pr) +
    Math.abs(shares.st - PLATE_GROUP_AIM.st);
  const score = Math.max(0, Math.round(100 - deviation * 70));

  let label: BalancedPlateLabel;
  if (score >= 80) label = 'Balanced';
  else if (score >= 60) label = 'Good, one tweak';
  else label = 'Needs a tweak';

  let tip: string;
  if (shares.vf < 0.4) {
    tip =
      'Fill half the plate with greens or fruit: dodo, isombe, cabbage or a banana.';
  } else if (shares.pr < 0.18) {
    tip = 'Add a palm-sized protein: beans, fish, eggs or sambaza.';
  } else if (shares.st > 0.35) {
    tip = 'Keep ugali, rice or potatoes to a quarter of the plate.';
  } else {
    tip = 'Balanced. This is the plate to repeat.';
  }

  return { score, shares, label, tip };
}

/** Lightweight label heuristic when the server has not classified yet. */
export function inferPlateGroupFromLabel(label: string): PlateGroup {
  const t = label.toLowerCase();
  if (/\b(isombe|dodo|spinach|cabbage|carrot|tomato|avocado|banana|fruit|salad|veg|imboga)\b/.test(t)) {
    return 'vf';
  }
  if (/\b(sambaza|tilapia|fish|chicken|beef|egg|beans|bean|groundnut|peanut|meat|protein|inyama)\b/.test(t)) {
    return 'pr';
  }
  if (/\b(ugali|rice|potato|sweet\s*potato|igikoma|matoke|cassava|bread|pasta|chapati|ibijumba|umuceri)\b/.test(t)) {
    return 'st';
  }
  return 'other';
}

export function withInferredPlateGroups<T extends { label: string; plateGroup?: PlateGroup | null; estimatedWeightG: number }>(
  items: T[],
): T[] {
  return items.map((item) => ({
    ...item,
    plateGroup: item.plateGroup ?? inferPlateGroupFromLabel(item.label),
  }));
}

export function resolveBalancedPlateForMeal(opts: {
  mealType?: string | null;
  items: PlateScoreItem[];
}): BalancedPlateScore | null {
  if (!mealTypeSupportsBalancedPlate(opts.mealType)) return null;
  return computeBalancedPlateScore(opts.items);
}

/** Body for PATCH /consumer/meals/:id/portions (Phase 2). */
export type UpdateMealPortionsRequest = {
  items: Array<{
    id: string;
    estimatedWeightG: number;
  }>;
};

/** Body for POST /consumer/meals/preview-portions (pre-submit live edits). */
export type PreviewMealPortionsRequest = {
  items: Array<{
    id: string;
    label?: string;
    estimatedWeightG: number;
    plateGroup?: PlateGroup | null;
    /** Nutrition at the current weight — server rescales from per-gram density. */
    nutrition?: {
      caloriesKcal: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
      sugarG?: number;
      sodiumMg?: number;
    };
    nutritionFoodId?: string;
  }>;
  logSource?: MealLogSource;
  mealType?: string;
};

export type MealPortionsResponse = {
  items: Array<{
    id: string;
    label?: string;
    estimatedWeightG: number;
    plateGroup?: PlateGroup | null;
    nutrition: {
      caloriesKcal: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      fiberG: number;
      sugarG?: number;
      sodiumMg?: number;
    };
  }>;
  totalNutrition: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  totalWeightG: number;
  balancedPlate: BalancedPlateScore | null;
  estimateRange: EstimateRange | null;
};
