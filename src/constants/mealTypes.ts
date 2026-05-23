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
