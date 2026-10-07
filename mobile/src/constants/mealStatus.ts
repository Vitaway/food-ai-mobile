import type { MealSubmissionStatus } from '@/types';

/** Local stub pipeline only; production submits go straight to in_review. */
export const PIPELINE_STEPS: MealSubmissionStatus[] = ['pending', 'analyzing', 'in_review'];

/** Delay after entering each step (ms). */
export const PIPELINE_STEP_DELAYS_MS: Record<MealSubmissionStatus, number> = {
  pending: 600,
  analyzing: 1400,
  in_review: 1800,
  approved: 0,
  rejected: 0,
};

export const MEAL_STATUS_LABELS: Record<MealSubmissionStatus, string> = {
  pending: 'Estimate',
  analyzing: 'Estimate',
  in_review: 'Estimate',
  approved: 'Confirmed',
  rejected: 'Rejected',
};

export const MEAL_STATUS_MESSAGES: Record<MealSubmissionStatus, string> = {
  pending: 'Counted as an estimate until Grace checks portions.',
  analyzing: 'Grace is reviewing this meal…',
  in_review: 'Grace usually checks within a few hours.',
  approved: 'Grace confirmed this meal.',
  rejected: 'We could not verify this meal. Try logging again.',
};

export function isPipelineActive(status: MealSubmissionStatus) {
  return status === 'pending' || status === 'analyzing';
}

export function isAwaitingCoachReview(status: MealSubmissionStatus) {
  return status === 'in_review' || status === 'pending' || status === 'analyzing';
}

/** Grace has confirmed the meal. */
export function isMealConfirmed(status: MealSubmissionStatus) {
  return status === 'approved';
}

/** Still an estimate awaiting Grace (or mid-pipeline). */
export function isMealEstimate(status: MealSubmissionStatus) {
  return status === 'pending' || status === 'analyzing' || status === 'in_review';
}

/** Meal contributes to today's totals (prototype: estimates count too). */
export function countsTowardDailyTotals(status: MealSubmissionStatus) {
  return status !== 'rejected';
}

export function isMealReadable(status: MealSubmissionStatus) {
  return status === 'approved' || isMealEstimate(status);
}
