import type { DetectedFoodItem } from '@/types';

type MicroMeta = { label: string; unit: string };

/**
 * Full TFCT nutrient set (and camelCase aliases) for in-app meal display.
 * Zeros are hidden (Decision 1 — hide empty rows).
 */
const MICRO_META: Record<string, MicroMeta> = {
  // Energy & macros beyond the primary macro strip
  animalProteinG: { label: 'Animal protein', unit: 'g' },
  mfpProteinG: { label: 'Meat/fish/poultry protein', unit: 'g' },
  saturatedFatG: { label: 'Saturated fat', unit: 'g' },
  monounsaturatedFatG: { label: 'Monounsaturated fat', unit: 'g' },
  polyunsaturatedFatG: { label: 'Polyunsaturated fat', unit: 'g' },
  cholesterolMg: { label: 'Cholesterol', unit: 'mg' },
  sugarG: { label: 'Sugar', unit: 'g' },
  phytateMg: { label: 'Phytate', unit: 'mg' },
  sodiumMg: { label: 'Sodium', unit: 'mg' },
  // Vitamins
  vitaminAMcg: { label: 'Vitamin A', unit: 'µg' },
  animalVitaminAMcg: { label: 'Animal vitamin A', unit: 'µg' },
  vitaminDUg: { label: 'Vitamin D', unit: 'µg' },
  vitaminEMg: { label: 'Vitamin E', unit: 'mg' },
  vitaminCMg: { label: 'Vitamin C', unit: 'mg' },
  thiaminMg: { label: 'Thiamin (B1)', unit: 'mg' },
  riboflavinMg: { label: 'Riboflavin (B2)', unit: 'mg' },
  niacinMg: { label: 'Niacin (B3)', unit: 'mg' },
  vitaminB6Mg: { label: 'Vitamin B6', unit: 'mg' },
  folateUg: { label: 'Folate', unit: 'µg' },
  vitaminB12Ug: { label: 'Vitamin B12', unit: 'µg' },
  pantothenicAcidMg: { label: 'Pantothenic acid', unit: 'mg' },
  // Minerals
  calciumMg: { label: 'Calcium', unit: 'mg' },
  phosphorusMg: { label: 'Phosphorus', unit: 'mg' },
  magnesiumMg: { label: 'Magnesium', unit: 'mg' },
  potassiumMg: { label: 'Potassium', unit: 'mg' },
  ironMg: { label: 'Iron', unit: 'mg' },
  mfpIronMg: { label: 'Meat/fish/poultry iron', unit: 'mg' },
  zincMg: { label: 'Zinc', unit: 'mg' },
  copperMg: { label: 'Copper', unit: 'mg' },
  manganeseMg: { label: 'Manganese', unit: 'mg' },
  // Amino acids
  tryptophanMg: { label: 'Tryptophan', unit: 'mg' },
  threonineMg: { label: 'Threonine', unit: 'mg' },
  isoleucineMg: { label: 'Isoleucine', unit: 'mg' },
  leucineMg: { label: 'Leucine', unit: 'mg' },
  lysineMg: { label: 'Lysine', unit: 'mg' },
  methionineMg: { label: 'Methionine', unit: 'mg' },
  cystineMg: { label: 'Cystine', unit: 'mg' },
  phenylalanineMg: { label: 'Phenylalanine', unit: 'mg' },
  tyrosineMg: { label: 'Tyrosine', unit: 'mg' },
  valineMg: { label: 'Valine', unit: 'mg' },
  arginineMg: { label: 'Arginine', unit: 'mg' },
  histidineMg: { label: 'Histidine', unit: 'mg' },
};

/** Map TFCT snake_case (and aliases) → canonical camelCase display keys. */
const KEY_ALIASES: Record<string, string> = {
  animal_protein_g: 'animalProteinG',
  mfp_protein_g: 'mfpProteinG',
  fasat_g: 'saturatedFatG',
  fams_g: 'monounsaturatedFatG',
  fapu_g: 'polyunsaturatedFatG',
  cholesterol_mg: 'cholesterolMg',
  sugar_g: 'sugarG',
  phytate_mg: 'phytateMg',
  sodium_mg: 'sodiumMg',
  iron_mg: 'ironMg',
  mfp_iron_mg: 'mfpIronMg',
  calcium_mg: 'calciumMg',
  potassium_mg: 'potassiumMg',
  magnesium_mg: 'magnesiumMg',
  zinc_mg: 'zincMg',
  phosphorus_mg: 'phosphorusMg',
  copper_mg: 'copperMg',
  manganese_mg: 'manganeseMg',
  vitamin_a_ug: 'vitaminAMcg',
  animal_vitamin_a_ug: 'animalVitaminAMcg',
  vitamin_c_mg: 'vitaminCMg',
  vitamin_d_ug: 'vitaminDUg',
  vitamin_e_mg: 'vitaminEMg',
  vitamin_b6_mg: 'vitaminB6Mg',
  vitamin_b12_ug: 'vitaminB12Ug',
  thiamin_mg: 'thiaminMg',
  riboflavin_mg: 'riboflavinMg',
  niacin_mg: 'niacinMg',
  folate_ug: 'folateUg',
  pantothenic_acid_mg: 'pantothenicAcidMg',
  tryptophan_mg: 'tryptophanMg',
  threonine_mg: 'threonineMg',
  isoleucine_mg: 'isoleucineMg',
  leucine_mg: 'leucineMg',
  lysine_mg: 'lysineMg',
  methionine_mg: 'methionineMg',
  cystine_mg: 'cystineMg',
  phenylalanine_mg: 'phenylalanineMg',
  tyrosine_mg: 'tyrosineMg',
  valine_mg: 'valineMg',
  arginine_mg: 'arginineMg',
  histidine_mg: 'histidineMg',
  // already-camel aliases
  animalProteinG: 'animalProteinG',
  mfpProteinG: 'mfpProteinG',
  saturatedFatG: 'saturatedFatG',
  monounsaturatedFatG: 'monounsaturatedFatG',
  polyunsaturatedFatG: 'polyunsaturatedFatG',
  cholesterolMg: 'cholesterolMg',
  sugarG: 'sugarG',
  phytateMg: 'phytateMg',
  sodiumMg: 'sodiumMg',
  ironMg: 'ironMg',
  mfpIronMg: 'mfpIronMg',
  calciumMg: 'calciumMg',
  potassiumMg: 'potassiumMg',
  magnesiumMg: 'magnesiumMg',
  zincMg: 'zincMg',
  phosphorusMg: 'phosphorusMg',
  copperMg: 'copperMg',
  manganeseMg: 'manganeseMg',
  vitaminAMcg: 'vitaminAMcg',
  animalVitaminAMcg: 'animalVitaminAMcg',
  vitaminCMg: 'vitaminCMg',
  vitaminDUg: 'vitaminDUg',
  vitaminDIu: 'vitaminDUg',
  vitaminEMg: 'vitaminEMg',
  vitaminB6Mg: 'vitaminB6Mg',
  vitaminB12Ug: 'vitaminB12Ug',
  thiaminMg: 'thiaminMg',
  riboflavinMg: 'riboflavinMg',
  niacinMg: 'niacinMg',
  folateUg: 'folateUg',
  pantothenicAcidMg: 'pantothenicAcidMg',
  tryptophanMg: 'tryptophanMg',
  threonineMg: 'threonineMg',
  isoleucineMg: 'isoleucineMg',
  leucineMg: 'leucineMg',
  lysineMg: 'lysineMg',
  methionineMg: 'methionineMg',
  cystineMg: 'cystineMg',
  phenylalanineMg: 'phenylalanineMg',
  tyrosineMg: 'tyrosineMg',
  valineMg: 'valineMg',
  arginineMg: 'arginineMg',
  histidineMg: 'histidineMg',
};

export type MealMicroRow = {
  key: string;
  label: string;
  display: string;
  value: number;
};

function normalizeMicroKey(raw: string): string | null {
  return KEY_ALIASES[raw] ?? null;
}

function roundMicro(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return String(Math.round(n * 10) / 10);
  return String(Math.round(n * 100) / 100);
}

/** Sum micronutrients across confirmed items (camel + TFCT snake keys). */
export function sumMealMicronutrients(items: DetectedFoodItem[] = []): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    for (const [rawKey, rawValue] of Object.entries(item.micronutrients ?? {})) {
      const key = normalizeMicroKey(rawKey);
      if (!key || !(key in MICRO_META)) continue;
      const n = Number(rawValue);
      if (!Number.isFinite(n) || n <= 0) continue;
      totals[key] = (totals[key] ?? 0) + n;
    }
    // Sugar / sodium sometimes live only on nutrition macros
    const sugar = Number(item.nutrition?.sugarG);
    if (Number.isFinite(sugar) && sugar > 0) {
      totals.sugarG = (totals.sugarG ?? 0) + sugar;
    }
    const sodium = Number(item.nutrition?.sodiumMg);
    if (Number.isFinite(sodium) && sodium > 0) {
      totals.sodiumMg = (totals.sodiumMg ?? 0) + sodium;
    }
  }
  return totals;
}

/**
 * Display rows for meal nutrition accordion.
 * Zeros and unknown keys are omitted; empty array means hide the micros subsection.
 */
export function mealMicronutrientRows(items: DetectedFoodItem[] = []): MealMicroRow[] {
  const totals = sumMealMicronutrients(items);
  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => {
      const meta = MICRO_META[key];
      return {
        key,
        label: meta.label,
        value,
        display: `${roundMicro(value)} ${meta.unit}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
