/** TFCT nutrient keys as stored in DB (match spreadsheet column names). */
export const TFCT_NUTRIENT_KEYS = [
  "energy_kcal",
  "protein_g",
  "animal_protein_g",
  "mfp_protein_g",
  "fat_g",
  "carb_g",
  "fasat_g",
  "fams_g",
  "fapu_g",
  "cholesterol_mg",
  "fiber_g",
  "sugar_g",
  "phytate_mg",
  "vitamin_a_ug",
  "animal_vitamin_a_ug",
  "vitamin_d_ug",
  "vitamin_e_mg",
  "vitamin_c_mg",
  "thiamin_mg",
  "riboflavin_mg",
  "niacin_mg",
  "vitamin_b6_mg",
  "folate_ug",
  "vitamin_b12_ug",
  "pantothenic_acid_mg",
  "calcium_mg",
  "phosphorus_mg",
  "magnesium_mg",
  "potassium_mg",
  "sodium_mg",
  "iron_mg",
  "mfp_iron_mg",
  "zinc_mg",
  "copper_mg",
  "manganese_mg",
  "tryptophan_mg",
  "threonine_mg",
  "isoleucine_mg",
  "leucine_mg",
  "lysine_mg",
  "methionine_mg",
  "cystine_mg",
  "phenylalanine_mg",
  "tyrosine_mg",
  "valine_mg",
  "arginine_mg",
  "histidine_mg",
] as const;

export type TfctNutrientKey = (typeof TFCT_NUTRIENT_KEYS)[number];

/** Legacy camelCase keys used by meal analysis / coach forms → TFCT snake_case. */
const CAMEL_TO_TFCT: Record<string, TfctNutrientKey> = {
  caloriesKcal: "energy_kcal",
  proteinG: "protein_g",
  carbsG: "carb_g",
  fatG: "fat_g",
  fiberG: "fiber_g",
  sugarG: "sugar_g",
  sodiumMg: "sodium_mg",
  ironMg: "iron_mg",
  calciumMg: "calcium_mg",
  vitaminCMg: "vitamin_c_mg",
  vitaminAMcg: "vitamin_a_ug",
  zincMg: "zinc_mg",
};

const TFCT_TO_CAMEL_MACRO: Partial<Record<TfctNutrientKey, string>> = {
  energy_kcal: "caloriesKcal",
  protein_g: "proteinG",
  carb_g: "carbsG",
  fat_g: "fatG",
  fiber_g: "fiberG",
  sugar_g: "sugarG",
  sodium_mg: "sodiumMg",
};

const TFCT_TO_CAMEL_MICRO: Partial<Record<TfctNutrientKey, string>> = {
  iron_mg: "ironMg",
  calcium_mg: "calciumMg",
  vitamin_c_mg: "vitaminCMg",
  vitamin_a_ug: "vitaminAMcg",
  zinc_mg: "zincMg",
};

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Keep only finite TFCT nutrient keys from a raw row/object. */
export function pickTfctComposition(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of TFCT_NUTRIENT_KEYS) {
    const n = asNumber(raw[key]);
    if (n != null) out[key] = n;
  }
  return out;
}

/**
 * Normalize inbound nutrition payloads (coach form camelCase and/or TFCT snake_case)
 * into snake_case composition for DB storage.
 */
export function toTfctComposition(input?: Record<string, number> | null): Record<string, number> {
  if (!input) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    const n = asNumber(value);
    if (n == null) continue;
    if ((TFCT_NUTRIENT_KEYS as readonly string[]).includes(key)) {
      out[key] = n;
      continue;
    }
    const mapped = CAMEL_TO_TFCT[key];
    if (mapped) out[mapped] = n;
  }
  return out;
}

/** Merge macros + micros camelCase payloads into one TFCT composition blob. */
export function composeTfctFromLegacy(opts: {
  nutritionPer100g?: Record<string, number> | null;
  micronutrients?: Record<string, number> | null;
}): Record<string, number> {
  return {
    ...toTfctComposition(opts.nutritionPer100g),
    ...toTfctComposition(opts.micronutrients),
  };
}

/** Read a nutrient supporting both snake_case (DB) and camelCase (legacy rows). */
export function readNutrient(
  composition: Record<string, number> | null | undefined,
  tfctKey: TfctNutrientKey,
  legacyCamel?: string,
): number {
  const row = composition ?? {};
  const fromTfct = asNumber(row[tfctKey]);
  if (fromTfct != null) return fromTfct;
  if (legacyCamel) {
    const fromLegacy = asNumber(row[legacyCamel]);
    if (fromLegacy != null) return fromLegacy;
  }
  return 0;
}

/** API-facing macros (camelCase) derived from stored composition. */
export function toLegacyNutritionPer100g(composition: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [tfct, camel] of Object.entries(TFCT_TO_CAMEL_MACRO)) {
    out[camel] = readNutrient(composition, tfct as TfctNutrientKey, camel);
  }
  // Preserve any extra camelCase already on legacy rows
  for (const [key, value] of Object.entries(composition)) {
    if (key in CAMEL_TO_TFCT || key in out) continue;
    const n = asNumber(value);
    if (n != null && /[A-Z]/.test(key)) out[key] = n;
  }
  return out;
}

/** API-facing micros (camelCase) derived from stored composition (+ legacy micronutrients blob). */
export function toLegacyMicronutrients(
  composition: Record<string, number>,
  legacyMicros?: Record<string, number> | null,
): Record<string, number> {
  const out: Record<string, number> = { ...(legacyMicros ?? {}) };
  for (const [tfct, camel] of Object.entries(TFCT_TO_CAMEL_MICRO)) {
    const n = readNutrient(composition, tfct as TfctNutrientKey, camel);
    if (n !== 0 || composition[tfct] != null) out[camel] = n;
  }
  return out;
}

/** Human-readable labels for composition UI (match spreadsheet spirit). */
export const TFCT_NUTRIENT_LABELS: Record<TfctNutrientKey, string> = {
  energy_kcal: "Energy (kcal)",
  protein_g: "Protein (g)",
  animal_protein_g: "Animal protein (g)",
  mfp_protein_g: "Meat/fish/poultry protein (g)",
  fat_g: "Fat (g)",
  carb_g: "Carbohydrate (g)",
  fasat_g: "Saturated fat (g)",
  fams_g: "Monounsaturated fat (g)",
  fapu_g: "Polyunsaturated fat (g)",
  cholesterol_mg: "Cholesterol (mg)",
  fiber_g: "Fiber (g)",
  sugar_g: "Sugar (g)",
  phytate_mg: "Phytate (mg)",
  vitamin_a_ug: "Vitamin A (µg)",
  animal_vitamin_a_ug: "Animal vitamin A (µg)",
  vitamin_d_ug: "Vitamin D (µg)",
  vitamin_e_mg: "Vitamin E (mg)",
  vitamin_c_mg: "Vitamin C (mg)",
  thiamin_mg: "Thiamin (mg)",
  riboflavin_mg: "Riboflavin (mg)",
  niacin_mg: "Niacin (mg)",
  vitamin_b6_mg: "Vitamin B6 (mg)",
  folate_ug: "Folate (µg)",
  vitamin_b12_ug: "Vitamin B12 (µg)",
  pantothenic_acid_mg: "Pantothenic acid (mg)",
  calcium_mg: "Calcium (mg)",
  phosphorus_mg: "Phosphorus (mg)",
  magnesium_mg: "Magnesium (mg)",
  potassium_mg: "Potassium (mg)",
  sodium_mg: "Sodium (mg)",
  iron_mg: "Iron (mg)",
  mfp_iron_mg: "Meat/fish/poultry iron (mg)",
  zinc_mg: "Zinc (mg)",
  copper_mg: "Copper (mg)",
  manganese_mg: "Manganese (mg)",
  tryptophan_mg: "Tryptophan (mg)",
  threonine_mg: "Threonine (mg)",
  isoleucine_mg: "Isoleucine (mg)",
  leucine_mg: "Leucine (mg)",
  lysine_mg: "Lysine (mg)",
  methionine_mg: "Methionine (mg)",
  cystine_mg: "Cystine (mg)",
  phenylalanine_mg: "Phenylalanine (mg)",
  tyrosine_mg: "Tyrosine (mg)",
  valine_mg: "Valine (mg)",
  arginine_mg: "Arginine (mg)",
  histidine_mg: "Histidine (mg)",
};
