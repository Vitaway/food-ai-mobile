import { isAwaitingCoachReview } from '@/constants/mealStatus';
import type { TranslationTree } from '@/i18n/en';
import type { MealSubmission } from '@/types';
import { mealTypeLabelFromT } from '@/utils/i18nLabels';

const GENERIC_MEAL_NAMES = new Set([
  'unspecified meal',
  'unspecified',
  'meal',
  'logged meal',
  'food',
  'none',
]);

export function isGenericMealName(name?: string | null) {
  if (!name?.trim()) return true;
  return GENERIC_MEAL_NAMES.has(name.trim().toLowerCase());
}

/** Prefer type · status when the name is missing/generic (e.g. “Unspecified Meal”). */
export function mealDisplayTitle(
  meal: Pick<MealSubmission, 'mealName' | 'mealType' | 'status'>,
  t?: TranslationTree,
): string {
  if (!isGenericMealName(meal.mealName)) {
    return meal.mealName!.trim();
  }
  if (!t) {
    return meal.mealType;
  }
  const typeLabel = mealTypeLabelFromT(t, meal.mealType);
  const statusLabel = isAwaitingCoachReview(meal.status) ? t.meal.waitingForCoach : t.meal.logged;
  return `${typeLabel} · ${statusLabel}`;
}

export function mealDisplaySubtitle(
  meal: Pick<MealSubmission, 'mealName' | 'mealType' | 'status'>,
  t?: TranslationTree,
): string | undefined {
  if (!t) {
    return meal.mealType;
  }
  if (isGenericMealName(meal.mealName)) {
    return isAwaitingCoachReview(meal.status) ? t.meal.waitingForCoach : undefined;
  }
  return mealTypeLabelFromT(t, meal.mealType);
}
