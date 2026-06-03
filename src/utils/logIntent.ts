import type { MealTypeId } from '@/constants/mealTypes';

/** Persists chosen meal slot when navigating to the Log tab (tab routes often drop params). */
let pendingMealType: MealTypeId | null = null;

export function setLogMealTypeIntent(mealType: MealTypeId) {
  pendingMealType = mealType;
}

export function consumeLogMealTypeIntent(): MealTypeId | null {
  const value = pendingMealType;
  pendingMealType = null;
  return value;
}
