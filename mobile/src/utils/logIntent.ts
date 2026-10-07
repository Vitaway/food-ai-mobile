import type { MealTypeId } from '@/constants/mealTypes';

export type LogMethodIntent = 'camera' | 'gallery' | 'describe' | 'barcode' | 'speak' | 'method';

/** Persists chosen meal slot when navigating to the Log tab (tab routes often drop params). */
let pendingMealType: MealTypeId | null = null;
let pendingMethod: LogMethodIntent | null = null;

type IntentListener = () => void;
const methodListeners = new Set<IntentListener>();

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
  methodListeners.forEach((listener) => listener());
}

export function consumeLogMethodIntent(): LogMethodIntent | null {
  const value = pendingMethod;
  pendingMethod = null;
  return value;
}

/** Lets the Log screen re-open camera when already focused (FAB re-tap). */
export function subscribeLogMethodIntent(listener: IntentListener) {
  methodListeners.add(listener);
  return () => {
    methodListeners.delete(listener);
  };
}
