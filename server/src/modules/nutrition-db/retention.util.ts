/**
 * Cooking retention factors for heat-labile micronutrients.
 * Provisional — must be verified against a published source before clinical launch.
 * Source note: prototype table (USDA Handbook 102-style magnitudes; not yet formally cited).
 */
export const COOKING_METHODS = [
  "Raw",
  "Boiled, water discarded",
  "Boiled, water retained",
  "Steamed",
  "Fried",
  "Stewed",
] as const;

export type CookingMethod = (typeof COOKING_METHODS)[number];

export type RetentionFactors = {
  vitamin_c_mg: number;
  folate_ug: number;
  vitamin_a_ug: number;
  potassium_mg: number;
};

export const RETENTION_BY_METHOD: Record<CookingMethod, RetentionFactors> = {
  Raw: { vitamin_c_mg: 1, folate_ug: 1, vitamin_a_ug: 1, potassium_mg: 1 },
  "Boiled, water discarded": {
    vitamin_c_mg: 0.45,
    folate_ug: 0.6,
    vitamin_a_ug: 0.8,
    potassium_mg: 0.75,
  },
  "Boiled, water retained": {
    vitamin_c_mg: 0.7,
    folate_ug: 0.8,
    vitamin_a_ug: 0.9,
    potassium_mg: 0.95,
  },
  Steamed: { vitamin_c_mg: 0.75, folate_ug: 0.85, vitamin_a_ug: 0.9, potassium_mg: 0.92 },
  Fried: { vitamin_c_mg: 0.65, folate_ug: 0.75, vitamin_a_ug: 0.85, potassium_mg: 0.9 },
  Stewed: { vitamin_c_mg: 0.55, folate_ug: 0.7, vitamin_a_ug: 0.85, potassium_mg: 0.85 },
};

export const RETENTION_PROVISIONAL = true;

export function retentionForMethod(method?: string | null): RetentionFactors {
  if (method && method in RETENTION_BY_METHOD) {
    return RETENTION_BY_METHOD[method as CookingMethod];
  }
  return RETENTION_BY_METHOD.Raw;
}

/** Apply retention multipliers to a nutrient total map (returns a copy). */
export function applyRetention(
  totals: Record<string, number>,
  method?: string | null,
): Record<string, number> {
  const ret = retentionForMethod(method);
  const out = { ...totals };
  for (const [key, factor] of Object.entries(ret)) {
    if (out[key] != null && Number.isFinite(out[key])) {
      out[key] = Math.round(out[key] * factor * 1e6) / 1e6;
    }
  }
  return out;
}
