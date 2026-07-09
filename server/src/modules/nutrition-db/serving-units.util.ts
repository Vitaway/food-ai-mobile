export const SERVING_UNITS = [
  "piece",
  "slice",
  "cup",
  "tbsp",
  "tsp",
  "g",
  "ml",
  "bottle",
  "can",
  "carton",
  "bowl",
  "plate",
] as const;

export type ServingUnit = (typeof SERVING_UNITS)[number];

/** Default gram weight for 1 display unit when no DB profile exists. */
export const DEFAULT_GRAMS_PER_UNIT: Record<ServingUnit, number> = {
  piece: 85,
  slice: 30,
  cup: 175,
  tbsp: 15,
  tsp: 5,
  g: 1,
  ml: 1,
  bottle: 330,
  can: 330,
  carton: 250,
  bowl: 300,
  plate: 400,
};

export function normalizeServingUnit(unit: string): ServingUnit {
  const lower = unit.trim().toLowerCase();
  if ((SERVING_UNITS as readonly string[]).includes(lower)) {
    return lower as ServingUnit;
  }
  return "g";
}

export function gramsForServing(unit: string, amount = 1, gramsEquivalent?: number): number {
  const normalized = normalizeServingUnit(unit);
  const perUnit = gramsEquivalent ?? DEFAULT_GRAMS_PER_UNIT[normalized];
  return Math.round(perUnit * amount * 100) / 100;
}
