import type { NutritionFacts } from '@/types';

export const ZERO_NUTRITION: NutritionFacts = {
  caloriesKcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarG: 0,
  sodiumMg: 0,
};

const NEGLIGIBLE_LABEL_PATTERNS = [
  /\bempty\b/i,
  /\bjust\s+(an?\s+)?(cup|glass|mug|bowl|plate|container)\b/i,
  /\b(cup|glass|mug|bowl|plate)\s+only\b/i,
  /\bno\s+food\b/i,
  /\b(plain\s+)?water\b/i,
  /\bblack\s+coffee\b/i,
  /\bcoffee\s+black\b/i,
  /\bunsweetened\s+(tea|coffee)\b/i,
  /\bdiet\s+(soda|cola|drink)\b/i,
  /\bsparkling\s+water\b/i,
];

const CALORIC_EXCEPTIONS = [/\bcoconut\s+water\b/i, /\btonic\s+water\b/i];

export function isNegligibleCalorieLabel(label: string): boolean {
  const cleaned = label.trim();
  if (!cleaned) return true;
  if (CALORIC_EXCEPTIONS.some((pattern) => pattern.test(cleaned))) return false;
  return NEGLIGIBLE_LABEL_PATTERNS.some((pattern) => pattern.test(cleaned));
}
