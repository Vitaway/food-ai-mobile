import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'mid_morning_snack', label: 'Mid-Morning Snack' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'afternoon_snack', label: 'Afternoon Snack' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'evening_snack', label: 'Evening Snack' },
  { id: 'pre_workout', label: 'Pre-Workout' },
  { id: 'post_workout', label: 'Post-Workout' },
] as const;

export type MealTypeId = (typeof MEAL_TYPES)[number]['id'];

export type MealTypeGroup = 'main' | 'snack' | 'workout';

export type MealTypeOption = {
  id: MealTypeId;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  timeHint: string;
  group: MealTypeGroup;
};

export const MEAL_TYPE_OPTIONS: MealTypeOption[] = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', timeHint: '6–10 AM', group: 'main' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline', timeHint: '11 AM–2 PM', group: 'main' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline', timeHint: '5–9 PM', group: 'main' },
  { id: 'mid_morning_snack', label: 'Mid-morning', icon: 'cafe-outline', timeHint: '10–12 PM', group: 'snack' },
  { id: 'afternoon_snack', label: 'Afternoon', icon: 'nutrition-outline', timeHint: '2–5 PM', group: 'snack' },
  { id: 'evening_snack', label: 'Evening', icon: 'ice-cream-outline', timeHint: 'After dinner', group: 'snack' },
  { id: 'pre_workout', label: 'Pre-workout', icon: 'barbell-outline', timeHint: 'Before exercise', group: 'workout' },
  { id: 'post_workout', label: 'Post-workout', icon: 'fitness-outline', timeHint: 'After exercise', group: 'workout' },
];

export const MEAL_TYPE_GROUPS: Array<{ key: MealTypeGroup; title: string }> = [
  { key: 'main', title: 'Main meals' },
  { key: 'snack', title: 'Snacks' },
  { key: 'workout', title: 'Workout' },
];

/** Home timeline slots in chronological order (workout types excluded). */
export const DAILY_MEAL_SLOT_ORDER = [
  'breakfast',
  'mid_morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'evening_snack',
] as const satisfies readonly MealTypeId[];

const MEALS_PER_DAY_SLOTS: Record<3 | 4 | 5 | 6, readonly MealTypeId[]> = {
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'afternoon_snack', 'dinner'],
  5: ['breakfast', 'mid_morning_snack', 'lunch', 'afternoon_snack', 'dinner'],
  6: DAILY_MEAL_SLOT_ORDER,
};

export function normalizeMealsPerDay(value: number | null | undefined): 3 | 4 | 5 | 6 {
  if (value === 3 || value === 4 || value === 5 || value === 6) return value;
  return 6;
}

/** Meal slots shown on home + used for daily logging progress. */
export function getDailyMealSlots(mealsPerDay: number | null | undefined): MealTypeId[] {
  return [...MEALS_PER_DAY_SLOTS[normalizeMealsPerDay(mealsPerDay)]];
}

export function isMealTypeId(value: string): value is MealTypeId {
  return MEAL_TYPES.some((type) => type.id === value);
}

/** Suggest a meal slot from the current clock (local time). */
export function suggestMealTypeForNow(date = new Date()): MealTypeId {
  const hour = date.getHours();

  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 12) return 'mid_morning_snack';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'afternoon_snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'evening_snack';
}
