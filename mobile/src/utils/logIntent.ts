import type { MealTypeId } from '@/constants/mealTypes';

export type LogMethodIntent = 'camera' | 'gallery' | 'describe';

/** Persists chosen meal slot when navigating to the Log tab (tab routes often drop params). */
let pendingMealType: MealTypeId | null = null;
let pendingMethod: LogMethodIntent | null = null;

export function setLogMealTypeIntent(mealType: MealTypeId) {
  pendingMealType = mealType;
}

export function consumeLogMealTypeIntent(): MealTypeId | null {
  const value = pendingMealType;
  pendingMealType = null;
  return value;
}

export function setLogMethodIntent(method: LogMethodIntent) {
  pendingMethod = method;
}

export function consumeLogMethodIntent(): LogMethodIntent | null {
  const value = pendingMethod;
  pendingMethod = null;
  return value;
}
