/**
 * Practical serving units for East African meal logging / nutrition DB.
 * Prefer metric + common household containers; avoid meat-cut or imperial labels.
 */
export const SERVING_UNITS = [
  // Weight / volume (metric)
  "g",
  "kg",
  "ml",
  "l",
  // Household measures
  "cup",
  "tbsp",
  "tsp",
  "glass",
  "bowl",
  "plate",
  // Discrete
  "piece",
  "slice",
  "serving",
  "portion",
  "scoop",
  "handful",
  // Packaged
  "bottle",
  "can",
  "carton",
  "jar",
  "packet",
  "sachet",
] as const;

export type ServingUnit = (typeof SERVING_UNITS)[number];

/** Default gram weight for 1 display unit when no DB profile exists. */
export const DEFAULT_GRAMS_PER_UNIT: Record<ServingUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  cup: 175,
  tbsp: 15,
  tsp: 5,
  glass: 240,
  bowl: 300,
  plate: 400,
  piece: 85,
  slice: 30,
  serving: 100,
  portion: 150,
  scoop: 30,
  handful: 40,
  bottle: 330,
  can: 330,
  carton: 250,
  jar: 200,
  packet: 50,
  sachet: 20,
};

export function normalizeServingUnit(unit: string): ServingUnit {
  const lower = unit.trim().toLowerCase();
  if ((SERVING_UNITS as readonly string[]).includes(lower)) {
    return lower as ServingUnit;
  }
  if (lower === "gram" || lower === "grams") return "g";
  if (lower === "kilogram" || lower === "kilograms") return "kg";
  if (lower === "milliliter" || lower === "millilitre" || lower === "milliliters") return "ml";
  if (lower === "liter" || lower === "litre" || lower === "liters") return "l";
  if (lower === "tablespoon" || lower === "tablespoons" || lower === "tbs") return "tbsp";
  if (lower === "teaspoon" || lower === "teaspoons") return "tsp";
  if (lower === "pcs" || lower === "pc" || lower === "each" || lower === "unit" || lower === "units") {
    return "piece";
  }
  return "g";
}

export function gramsForServing(unit: string, amount = 1, gramsEquivalent?: number): number {
  const normalized = normalizeServingUnit(unit);
  const perUnit = gramsEquivalent ?? DEFAULT_GRAMS_PER_UNIT[normalized];
  return Math.round(perUnit * amount * 100) / 100;
}

/** Human-readable labels for admin / coach UIs. */
export const SERVING_UNIT_LABELS: Record<ServingUnit, string> = {
  g: "g (gram)",
  kg: "kg (kilogram)",
  ml: "ml (milliliter)",
  l: "l (liter)",
  cup: "cup",
  tbsp: "tbsp (tablespoon)",
  tsp: "tsp (teaspoon)",
  glass: "glass",
  bowl: "bowl",
  plate: "plate",
  piece: "piece",
  slice: "slice",
  serving: "serving",
  portion: "portion",
  scoop: "scoop",
  handful: "handful",
  bottle: "bottle",
  can: "can",
  carton: "carton",
  jar: "jar",
  packet: "packet",
  sachet: "sachet",
};

export function servingUnitLabel(unit: string): string {
  const normalized = normalizeServingUnit(unit);
  return SERVING_UNIT_LABELS[normalized] ?? unit;
}
