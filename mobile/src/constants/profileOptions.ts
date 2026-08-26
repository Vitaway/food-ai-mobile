import type { ActivityLevel, GoalPace, HealthGoal } from '@/types';

export const HEALTH_GOALS: { id: HealthGoal; label: string; description: string }[] = [
  { id: 'lose_weight', label: 'Lose weight', description: 'Calorie deficit with balanced macros' },
  { id: 'maintain_weight', label: 'Maintain weight', description: 'Stay at your current weight' },
  { id: 'gain_muscle', label: 'Gain muscle', description: 'Higher protein and slight surplus' },
  { id: 'improve_quality', label: 'Improve diet quality', description: 'Focus on whole foods and fiber' },
];

export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; description: string }[] = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { id: 'lightly_active', label: 'Lightly active', description: '1–3 days per week' },
  { id: 'moderately_active', label: 'Moderately active', description: '3–5 days per week' },
  { id: 'very_active', label: 'Very active', description: '6–7 days per week' },
  { id: 'extremely_active', label: 'Extremely active', description: 'Athlete or physical job' },
];

export const GOAL_PACE_OPTIONS: { id: GoalPace; label: string; description: string }[] = [
  { id: 'slow', label: 'Slow & steady', description: '~0.25 kg per week' },
  { id: 'moderate', label: 'Moderate', description: '~0.5 kg per week' },
  { id: 'aggressive', label: 'Aggressive', description: '~0.75 kg per week' },
];

export const MEALS_PER_DAY_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export const COMMON_ALLERGIES = [
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

export type CommonAllergy = (typeof COMMON_ALLERGIES)[number];

export const ALLERGY_META: Record<CommonAllergy, { emoji: string; hint: string }> = {
  Peanuts: { emoji: '🥜', hint: 'Peanut products' },
  'Tree nuts': { emoji: '🌰', hint: 'Almonds, cashews…' },
  Dairy: { emoji: '🥛', hint: 'Milk & cheese' },
  Eggs: { emoji: '🥚', hint: 'Egg products' },
  Gluten: { emoji: '🌾', hint: 'Wheat gluten' },
  Soy: { emoji: '🫘', hint: 'Soybean foods' },
  Shellfish: { emoji: '🦐', hint: 'Shrimp, crab…' },
  Fish: { emoji: '🐟', hint: 'Finned fish' },
  Sesame: { emoji: '🌱', hint: 'Seeds & oil' },
};

/** Suggest allergies from dietary preferences (user can change). */
export function defaultAllergiesFromPreferences(prefs: string[]): CommonAllergy[] {
  const next = new Set<CommonAllergy>();
  if (prefs.includes('Dairy-free') || prefs.includes('Vegan')) next.add('Dairy');
  if (prefs.includes('Gluten-free')) next.add('Gluten');
  if (prefs.includes('Vegan')) next.add('Eggs');
  return [...next];
}

export const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Kosher',
  'Low-carb',
  'High-protein',
] as const;

export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number];

export const DIETARY_PREFERENCE_META: Record<
  DietaryPreference,
  { emoji: string; hint: string }
> = {
  Vegetarian: { emoji: '🥗', hint: 'No meat' },
  Vegan: { emoji: '🌱', hint: 'Plant-based' },
  'Gluten-free': { emoji: '🌾', hint: 'No wheat gluten' },
  'Dairy-free': { emoji: '🥛', hint: 'No milk products' },
  Halal: { emoji: '🕌', hint: 'Halal foods' },
  Kosher: { emoji: '✡️', hint: 'Kosher foods' },
  'Low-carb': { emoji: '🥑', hint: 'Fewer carbs' },
  'High-protein': { emoji: '🍗', hint: 'More protein' },
};

/** Sensible starter prefs from the user's goal (user can toggle off). */
export function defaultDietaryPreferencesForGoal(goal: HealthGoal): DietaryPreference[] {
  if (goal === 'lose_weight') return ['High-protein', 'Low-carb'];
  if (goal === 'gain_muscle') return ['High-protein'];
  return ['High-protein'];
}

export function formatHealthGoal(goal: HealthGoal) {
  return HEALTH_GOALS.find((entry) => entry.id === goal)?.label ?? goal;
}

export function formatActivityLevel(level: ActivityLevel) {
  return ACTIVITY_LEVELS.find((entry) => entry.id === level)?.label ?? level;
}
