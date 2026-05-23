import type { ActivityLevel, HealthGoal } from '@/types';

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

export function formatHealthGoal(goal: HealthGoal) {
  return HEALTH_GOALS.find((entry) => entry.id === goal)?.label ?? goal;
}

export function formatActivityLevel(level: ActivityLevel) {
  return ACTIVITY_LEVELS.find((entry) => entry.id === level)?.label ?? level;
}
