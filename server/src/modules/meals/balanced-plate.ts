/**
 * Phase 0 contracts — Balanced Plate + estimate honesty.
 * Mirrors MiraFood-Prototype_2.html plateScore + RANGE.
 */

export type PlateGroup = "vf" | "pr" | "st" | "other";

export type BalancedPlateLabel = "Balanced" | "Good, one tweak" | "Needs a tweak";

export type PlateGroupShares = {
  vf: number;
  pr: number;
  st: number;
};

export type BalancedPlateScore = {
  score: number;
  shares: PlateGroupShares;
  label: BalancedPlateLabel;
  tip: string;
};

export type MealLogSource = "photo" | "voice" | "search" | "repeat" | "barcode" | "text";

export type EstimateRange = {
  midKcal: number;
  lowKcal: number;
  highKcal: number;
  pct: number;
  source: MealLogSource;
};

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

export const PLATE_GROUP_LABELS: Record<"vf" | "pr" | "st", string> = {
  vf: "Vegetables and fruit",
  pr: "Protein",
  st: "Starch",
};

export function mealTypeSupportsBalancedPlate(mealType: string | null | undefined): boolean {
  if (!mealType) return false;
  const key = mealType.toLowerCase();
  return key === "lunch" || key === "dinner";
}

export function estimateRangeFromMid(midKcal: number, source: MealLogSource): EstimateRange {
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

export function computeBalancedPlateScore(items: PlateScoreItem[]): BalancedPlateScore | null {
  const scored = items.filter((item) => {
    const g = item.plateGroup;
    return (g === "vf" || g === "pr" || g === "st") && item.estimatedWeightG > 0;
  });
  const totalG = scored.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  if (totalG <= 0) return null;

  const shares: PlateGroupShares = { vf: 0, pr: 0, st: 0 };
  for (const item of scored) {
    const g = item.plateGroup as "vf" | "pr" | "st";
    shares[g] += item.estimatedWeightG / totalG;
  }

  const deviation =
    Math.abs(shares.vf - PLATE_GROUP_AIM.vf) +
    Math.abs(shares.pr - PLATE_GROUP_AIM.pr) +
    Math.abs(shares.st - PLATE_GROUP_AIM.st);
  const score = Math.max(0, Math.round(100 - deviation * 70));

  let label: BalancedPlateLabel;
  if (score >= 80) label = "Balanced";
  else if (score >= 60) label = "Good, one tweak";
  else label = "Needs a tweak";

  let tip: string;
  if (shares.vf < 0.4) {
    tip =
      "Fill half the plate with greens or fruit: dodo, isombe, cabbage or a banana.";
  } else if (shares.pr < 0.18) {
    tip = "Add a palm-sized protein: beans, fish, eggs or sambaza.";
  } else if (shares.st > 0.35) {
    tip = "Keep ugali, rice or potatoes to a quarter of the plate.";
  } else {
    tip = "Balanced. This is the plate to repeat.";
  }

  return { score, shares, label, tip };
}

/**
 * Ideal demo plate from the prototype story card:
 * sambaza 100 + ugali 150 + dodo 120 + avocado 50.
 */
export function resolveBalancedPlateForMeal(opts: {
  mealType?: string | null;
  items: PlateScoreItem[];
}): BalancedPlateScore | null {
  if (!mealTypeSupportsBalancedPlate(opts.mealType)) return null;
  return computeBalancedPlateScore(opts.items);
}
