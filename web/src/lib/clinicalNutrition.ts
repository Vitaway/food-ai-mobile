/** Mirrors server clinical-nutrients.util — curated 15-nutrient panel. */
export const CLINICAL_NUTRIENT_PANEL = [
  { key: 'energy_kcal', label: 'Energy', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carb_g', label: 'Carbs', unit: 'g' },
  { key: 'sugar_g', label: 'Sugars', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'fasat_g', label: 'Saturated', unit: 'g' },
  { key: 'fiber_g', label: 'Fibre', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'vitamin_a_ug', label: 'Vitamin A', unit: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'folate_ug', label: 'Folate', unit: 'mcg' },
] as const;

export const FOOD_ALLERGENS = ['Peanut', 'Dairy', 'Egg', 'Fish', 'Soy', 'Gluten'] as const;

export const PREPARATION_STATES = [
  'Raw',
  'Raw, peeled',
  'Boiled',
  'Dry',
  'Flour',
  'Oil',
  'Baked',
  'Granulated',
  'Liquid',
] as const;

export const COOKING_METHODS = [
  'Raw',
  'Boiled, water discarded',
  'Boiled, water retained',
  'Steamed',
  'Fried',
  'Stewed',
] as const;

export const DATA_SOURCES = [
  'TFCT 2008',
  'USDA',
  'Manufacturer label',
  'Lab analysis',
  'Coach estimate',
  'Other',
] as const;

export function atwaterCheck(composition: Record<string, number | null | undefined>) {
  const energy = composition.energy_kcal;
  const protein = composition.protein_g;
  const carb = composition.carb_g;
  const fat = composition.fat_g;
  if (energy == null || protein == null || carb == null || fat == null || energy <= 0) return null;
  const calculated = protein * 4 + carb * 4 + fat * 9;
  const deltaPct = ((calculated - energy) / energy) * 100;
  return { declared: energy, calculated, deltaPct };
}

export function fieldDots(filled: number, total: number) {
  return Array.from({ length: total }, (_, i) => i < filled);
}
