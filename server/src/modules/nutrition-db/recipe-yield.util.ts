import { TFCT_NUTRIENT_KEYS, type TfctNutrientKey } from "./tfct-nutrients";
import { applyRetention } from "./retention.util";

export type RecipeIngredientInput = {
  /** Per-100g composition (TFCT snake_case preferred). */
  compositionPer100g: Record<string, number>;
  /** As-purchased / raw weight in grams. */
  rawWeightG: number;
  /** Edible portion factor (default 1). edibleG = rawWeightG * epf. */
  ediblePortionFactor?: number;
  /** Skip non-default variant lines. */
  includeInComposition?: boolean;
};

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function edibleWeightG(rawWeightG: number, ediblePortionFactor = 1): number {
  const epf = Number.isFinite(ediblePortionFactor) ? Math.max(0, ediblePortionFactor) : 1;
  return Math.max(0, rawWeightG) * epf;
}

/** Scale a per-100g composition by edible weight (g). */
export function nutrientsForRawWeight(
  compositionPer100g: Record<string, number>,
  rawWeightG: number,
  ediblePortionFactor = 1,
): Record<string, number> {
  const factor = edibleWeightG(rawWeightG, ediblePortionFactor) / 100;
  const out: Record<string, number> = {};
  for (const key of TFCT_NUTRIENT_KEYS) {
    const n = asNumber(compositionPer100g[key]);
    if (n === 0 && compositionPer100g[key] == null) {
      continue;
    }
    if (n !== 0 || compositionPer100g[key] != null) {
      out[key] = Math.round(n * factor * 1e6) / 1e6;
    }
  }
  for (const [key, value] of Object.entries(compositionPer100g)) {
    if ((TFCT_NUTRIENT_KEYS as readonly string[]).includes(key)) continue;
    const n = asNumber(value);
    if (!Number.isFinite(n)) continue;
    out[key] = Math.round(n * factor * 1e6) / 1e6;
  }
  return out;
}

/** Sum nutrient maps. */
export function sumNutrientMaps(maps: Record<string, number>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      const n = asNumber(value);
      if (!Number.isFinite(n)) continue;
      out[key] = (out[key] ?? 0) + n;
    }
  }
  for (const key of Object.keys(out)) {
    out[key] = Math.round(out[key] * 1e6) / 1e6;
  }
  return out;
}

/**
 * Clinical cooked-yield pipeline:
 * 1. Sum nutrients from edible weights (raw × EPF)
 * 2. Apply cooking-method retention to heat-labile micros
 * 3. Divide by cooked yield weight → per-gram
 * 4. ×100 → per-100g of cooked dish
 * 5. × servingWeightG → per-serving
 */
export function calculateRecipeNutrition(opts: {
  ingredients: RecipeIngredientInput[];
  cookedYieldG: number;
  servingWeightG?: number;
  cookingMethod?: string | null;
}): {
  totalNutrients: Record<string, number>;
  totalBeforeRetention: Record<string, number>;
  perGram: Record<string, number>;
  per100g: Record<string, number>;
  perServing: Record<string, number> | null;
  rawEdibleTotalG: number;
  yieldFactor: number | null;
  energyByIngredient: Array<{ index: number; kcal: number; edibleG: number }>;
} {
  const active = opts.ingredients.filter((ing) => ing.includeInComposition !== false);
  const lineMaps = active.map((ing, index) => {
    const edibleG = edibleWeightG(ing.rawWeightG, ing.ediblePortionFactor ?? 1);
    const map = nutrientsForRawWeight(
      ing.compositionPer100g,
      ing.rawWeightG,
      ing.ediblePortionFactor ?? 1,
    );
    return { index, edibleG, map };
  });

  const rawEdibleTotalG = lineMaps.reduce((sum, row) => sum + row.edibleG, 0);
  const totalBeforeRetention = sumNutrientMaps(lineMaps.map((row) => row.map));
  const totals = applyRetention(totalBeforeRetention, opts.cookingMethod);

  const energyByIngredient = lineMaps.map((row) => ({
    index: row.index,
    edibleG: row.edibleG,
    kcal: asNumber(row.map.energy_kcal ?? row.map.caloriesKcal),
  }));

  const cooked = Math.max(0, opts.cookedYieldG);
  const yieldFactor = rawEdibleTotalG > 0 && cooked > 0 ? cooked / rawEdibleTotalG : null;

  if (cooked <= 0) {
    return {
      totalNutrients: totals,
      totalBeforeRetention,
      perGram: {},
      per100g: {},
      perServing: null,
      rawEdibleTotalG,
      yieldFactor,
      energyByIngredient,
    };
  }

  const perGram: Record<string, number> = {};
  const per100g: Record<string, number> = {};
  for (const [key, value] of Object.entries(totals)) {
    const g = value / cooked;
    perGram[key] = Math.round(g * 1e8) / 1e8;
    per100g[key] = Math.round(g * 100 * 1e6) / 1e6;
  }

  const servingW = opts.servingWeightG != null ? Math.max(0, opts.servingWeightG) : null;
  let perServing: Record<string, number> | null = null;
  if (servingW != null && servingW > 0) {
    perServing = {};
    for (const [key, value] of Object.entries(perGram)) {
      perServing[key] = Math.round(value * servingW * 1e6) / 1e6;
    }
  }

  return {
    totalNutrients: totals,
    totalBeforeRetention,
    perGram,
    per100g,
    perServing,
    rawEdibleTotalG,
    yieldFactor,
    energyByIngredient,
  };
}

/** Keep only known TFCT keys with finite values (for DB storage). */
export function pickTfctRecipeComposition(raw: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of TFCT_NUTRIENT_KEYS) {
    const n = asNumber(raw[key]);
    if (raw[key] == null || !Number.isFinite(n)) continue;
    out[key as TfctNutrientKey] = n;
  }
  return out;
}
