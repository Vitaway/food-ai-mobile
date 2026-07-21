import type { ClinicalAssessmentData } from '@/api/coachApi';

export const HEALTH_GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'maintain_weight', label: 'Maintain weight' },
  { value: 'gain_muscle', label: 'Gain muscle' },
  { value: 'improve_quality', label: 'Improve diet quality' },
] as const;

export const GOAL_PACE_OPTIONS = [
  { value: 'slow', label: 'Slow & steady' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly active' },
  { value: 'moderately_active', label: 'Moderately active' },
  { value: 'very_active', label: 'Very active' },
  { value: 'extremely_active', label: 'Extremely active' },
] as const;

export const MEALS_PER_DAY_OPTIONS = [2, 3, 4, 5, 6] as const;

export const DIETARY_PREFERENCE_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Kosher',
  'Low-carb',
  'High-protein',
] as const;

export const COMMON_ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree nuts',
  'Dairy',
  'Eggs',
  'Gluten',
  'Soy',
  'Shellfish',
  'Fish',
  'Sesame',
] as const;

export const DIABETES_TYPE_OPTIONS = [
  { value: 'type_1', label: 'Type 1' },
  { value: 'type_2', label: 'Type 2' },
  { value: 'gestational', label: 'Gestational' },
  { value: 'prediabetes', label: 'Prediabetes' },
  { value: 'other', label: 'Other / unspecified' },
] as const;

export const CKD_STAGE_OPTIONS = [
  { value: 'stage_1', label: 'Stage 1' },
  { value: 'stage_2', label: 'Stage 2' },
  { value: 'stage_3', label: 'Stage 3' },
  { value: 'stage_4', label: 'Stage 4' },
  { value: 'stage_5', label: 'Stage 5' },
  { value: 'unknown', label: 'Unknown / not staged' },
] as const;

export const OCCUPATION_OPTIONS = [
  { value: 'desk_job', label: 'Desk job / seated most of day' },
  { value: 'light_standing', label: 'Light standing / mixed' },
  { value: 'on_feet', label: 'On feet most of the day' },
  { value: 'physical_labor', label: 'Physical labor' },
  { value: 'athlete', label: 'Athlete / high training load' },
  { value: 'other', label: 'Other' },
] as const;

export const SLEEP_HOURS_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const;

function conditionKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function ageFromDateOfBirth(value: string | undefined) {
  if (!value) return null;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

/**
 * Strip fields that no longer apply (e.g. pregnancy on male, diabetes details when unchecked)
 * so hidden UI values are not persisted or used in calculations.
 */
export function sanitizeClinicalAssessmentData(
  data: ClinicalAssessmentData,
): ClinicalAssessmentData {
  const age = ageFromDateOfBirth(data.verifiedDateOfBirth) ?? data.verifiedAge ?? null;
  const isFemaleAdult = data.verifiedSex === 'female' && (age == null || age >= 18);

  const next: ClinicalAssessmentData = { ...data };

  if (!isFemaleAdult) {
    next.pregnant = false;
    next.lactating = false;
    next.trimester = null;
    next.numberOfBabies = null;
    next.prePregnancyWeightKg = null;
  } else if (next.pregnant) {
    next.lactating = false;
  } else {
    next.trimester = null;
    next.numberOfBabies = null;
    next.prePregnancyWeightKg = null;
  }

  const conditions = [...(next.conditions ?? [])];
  const details: Record<string, unknown> = { ...(next.conditionDetails ?? {}) };
  const allowedKeys = new Set(conditions.map(conditionKey));
  for (const key of Object.keys(details)) {
    if (!allowedKeys.has(key)) delete details[key];
  }
  next.conditions = conditions;
  next.conditionDetails = details;

  if (!conditions.includes('Kidney Disease')) {
    next.fluidRestriction = false;
  }

  return next;
}
