const GROUPS: Array<{ title: string; keys: string[] }> = [
  {
    title: 'Energy & macros',
    keys: [
      'energy_kcal',
      'protein_g',
      'animal_protein_g',
      'mfp_protein_g',
      'fat_g',
      'carb_g',
      'fasat_g',
      'fams_g',
      'fapu_g',
      'cholesterol_mg',
      'fiber_g',
      'sugar_g',
      'phytate_mg',
    ],
  },
  {
    title: 'Vitamins',
    keys: [
      'vitamin_a_ug',
      'animal_vitamin_a_ug',
      'vitamin_d_ug',
      'vitamin_e_mg',
      'vitamin_c_mg',
      'thiamin_mg',
      'riboflavin_mg',
      'niacin_mg',
      'vitamin_b6_mg',
      'folate_ug',
      'vitamin_b12_ug',
      'pantothenic_acid_mg',
    ],
  },
  {
    title: 'Minerals',
    keys: [
      'calcium_mg',
      'phosphorus_mg',
      'magnesium_mg',
      'potassium_mg',
      'sodium_mg',
      'iron_mg',
      'mfp_iron_mg',
      'zinc_mg',
      'copper_mg',
      'manganese_mg',
    ],
  },
  {
    title: 'Amino acids',
    keys: [
      'tryptophan_mg',
      'threonine_mg',
      'isoleucine_mg',
      'leucine_mg',
      'lysine_mg',
      'methionine_mg',
      'cystine_mg',
      'phenylalanine_mg',
      'tyrosine_mg',
      'valine_mg',
      'arginine_mg',
      'histidine_mg',
    ],
  },
];

const LABELS: Record<string, string> = {
  energy_kcal: 'Energy (kcal)',
  protein_g: 'Protein (g)',
  animal_protein_g: 'Animal protein (g)',
  mfp_protein_g: 'MFP protein (g)',
  fat_g: 'Fat (g)',
  carb_g: 'Carbohydrate (g)',
  fasat_g: 'Saturated fat (g)',
  fams_g: 'Monounsaturated fat (g)',
  fapu_g: 'Polyunsaturated fat (g)',
  cholesterol_mg: 'Cholesterol (mg)',
  fiber_g: 'Fiber (g)',
  sugar_g: 'Sugar (g)',
  phytate_mg: 'Phytate (mg)',
  vitamin_a_ug: 'Vitamin A (µg)',
  animal_vitamin_a_ug: 'Animal vitamin A (µg)',
  vitamin_d_ug: 'Vitamin D (µg)',
  vitamin_e_mg: 'Vitamin E (mg)',
  vitamin_c_mg: 'Vitamin C (mg)',
  thiamin_mg: 'Thiamin (mg)',
  riboflavin_mg: 'Riboflavin (mg)',
  niacin_mg: 'Niacin (mg)',
  vitamin_b6_mg: 'Vitamin B6 (mg)',
  folate_ug: 'Folate (µg)',
  vitamin_b12_ug: 'Vitamin B12 (µg)',
  pantothenic_acid_mg: 'Pantothenic acid (mg)',
  calcium_mg: 'Calcium (mg)',
  phosphorus_mg: 'Phosphorus (mg)',
  magnesium_mg: 'Magnesium (mg)',
  potassium_mg: 'Potassium (mg)',
  sodium_mg: 'Sodium (mg)',
  iron_mg: 'Iron (mg)',
  mfp_iron_mg: 'MFP iron (mg)',
  zinc_mg: 'Zinc (mg)',
  copper_mg: 'Copper (mg)',
  manganese_mg: 'Manganese (mg)',
  tryptophan_mg: 'Tryptophan (mg)',
  threonine_mg: 'Threonine (mg)',
  isoleucine_mg: 'Isoleucine (mg)',
  leucine_mg: 'Leucine (mg)',
  lysine_mg: 'Lysine (mg)',
  methionine_mg: 'Methionine (mg)',
  cystine_mg: 'Cystine (mg)',
  phenylalanine_mg: 'Phenylalanine (mg)',
  tyrosine_mg: 'Tyrosine (mg)',
  valine_mg: 'Valine (mg)',
  arginine_mg: 'Arginine (mg)',
  histidine_mg: 'Histidine (mg)',
};

function formatValue(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

/** Read-only grid of TFCT composition columns (per 100g). */
export function TfctCompositionGrid({ composition }: { composition?: Record<string, number> | null }) {
  const data = composition ?? {};
  const hasAny = Object.keys(data).length > 0;

  if (!hasAny) {
    return <p className="text-sm text-ash-grey-500">No composition data for this food.</p>;
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
            {group.title}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {group.keys.map((key) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-2 border-b border-ash-grey-100 py-1 text-sm">
                <span className="text-ash-grey-600">{LABELS[key] ?? key}</span>
                <span className="font-medium tabular-nums text-ash-grey-900">
                  {formatValue(data[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
