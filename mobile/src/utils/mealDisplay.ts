import { MEAL_TYPES } from '@/constants/mealTypes';
import { MEAL_STATUS_LABELS, isAwaitingCoachReview } from '@/constants/mealStatus';
import type { MealSubmission, MealSubmissionStatus } from '@/types';

const GENERIC_MEAL_NAMES = new Set([
  'unspecified meal',
  'unspecified',
  'meal',
  'logged meal',
  'food',
  'none',
]);

export function mealTypeLabel(mealType: string) {
  return MEAL_TYPES.find((type) => type.id === mealType)?.label ?? 'Meal';
}

export function isGenericMealName(name?: string | null) {
  if (!name?.trim()) return true;
  return GENERIC_MEAL_NAMES.has(name.trim().toLowerCase());
}

/** Prefer type · status when the name is missing/generic (e.g. “Unspecified Meal”). */
export function mealDisplayTitle(
  meal: Pick<MealSubmission, 'mealName' | 'mealType' | 'status'>,
): string {
  if (!isGenericMealName(meal.mealName)) {
    return meal.mealName!.trim();
  }
  const typeLabel = mealTypeLabel(meal.mealType);
  const statusLabel = MEAL_STATUS_LABELS[meal.status as MealSubmissionStatus] ?? 'Logged';
  return `${typeLabel} · ${statusLabel}`;
}

export function mealDisplaySubtitle(
  meal: Pick<MealSubmission, 'mealName' | 'mealType' | 'status'>,
): string | undefined {
  if (isGenericMealName(meal.mealName)) {
    return isAwaitingCoachReview(meal.status) ? 'Waiting for coach review' : undefined;
  }
  return mealTypeLabel(meal.mealType);
}
