import { TFCT_NUTRIENT_KEYS, type TfctNutrientKey } from "./tfct-nutrients";

export type RecipeIngredientInput = {
  /** Per-100g composition (TFCT snake_case preferred). */
  compositionPer100g: Record<string, number>;
  /** Raw ingredient weight in grams. */
  rawWeightG: number;
};

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Scale a per-100g composition by raw weight (g). */
export function nutrientsForRawWeight(
  compositionPer100g: Record<string, number>,
  rawWeightG: number,
): Record<string, number> {
  const factor = Math.max(0, rawWeightG) / 100;
  const out: Record<string, number> = {};
  for (const key of TFCT_NUTRIENT_KEYS) {
    const n = asNumber(compositionPer100g[key]);
    if (n === 0 && compositionPer100g[key] == null) {
      // Also accept any other finite keys already on the row.
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
 * 1. Sum nutrients from raw ingredient weights
 * 2. Divide by cooked yield weight → per-gram
 * 3. ×100 → per-100g of cooked dish
 * 4. × servingWeightG → per-serving
 */
export function calculateRecipeNutrition(opts: {
  ingredients: RecipeIngredientInput[];
  cookedYieldG: number;
  servingWeightG?: number;
}): {
  totalNutrients: Record<string, number>;
  perGram: Record<string, number>;
  per100g: Record<string, number>;
  perServing: Record<string, number> | null;
} {
  const totals = sumNutrientMaps(
    opts.ingredients.map((ing) => nutrientsForRawWeight(ing.compositionPer100g, ing.rawWeightG)),
  );

  const cooked = Math.max(0, opts.cookedYieldG);
  if (cooked <= 0) {
    return {
      totalNutrients: totals,
      perGram: {},
      per100g: {},
      perServing: null,
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

  return { totalNutrients: totals, perGram, per100g, perServing };
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
