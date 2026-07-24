import type { MealSubmissionStatus } from '@/types';

/** Local stub pipeline only — production submits go straight to in_review. */
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
  pending: 'Pending',
  analyzing: 'In review',
  in_review: 'In review',
  approved: 'Ready',
  rejected: 'Rejected',
};

export const MEAL_STATUS_MESSAGES: Record<MealSubmissionStatus, string> = {
  pending: 'Queued for your coach…',
  analyzing: 'A coach is reviewing your meal…',
  in_review: 'A coach is reviewing your meal…',
  approved: 'Your coach confirmed this meal — tap to view.',
  rejected: 'We could not verify this meal. Try logging again.',
};

export function isPipelineActive(status: MealSubmissionStatus) {
  return status === 'pending' || status === 'analyzing';
}

export function isAwaitingCoachReview(status: MealSubmissionStatus) {
  return status === 'in_review' || status === 'pending' || status === 'analyzing';
}

export function isMealReadable(status: MealSubmissionStatus) {
  return status === 'approved';
}
