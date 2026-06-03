import type { MealSubmissionStatus } from '@/types';

export const PIPELINE_STEPS: MealSubmissionStatus[] = ['pending', 'analyzing', 'in_review', 'approved'];

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
  analyzing: 'Analyzing',
  in_review: 'In review',
  approved: 'Ready',
  rejected: 'Rejected',
};

export const MEAL_STATUS_MESSAGES: Record<MealSubmissionStatus, string> = {
  pending: 'Queued for analysis…',
  analyzing: 'AI is identifying ingredients…',
  in_review: 'A coach is reviewing your meal…',
  approved: 'Analysis complete — tap to view.',
  rejected: 'We could not verify this meal. Try logging again.',
};

export function isPipelineActive(status: MealSubmissionStatus) {
  return status === 'pending' || status === 'analyzing' || status === 'in_review';
}

export function isMealReadable(status: MealSubmissionStatus) {
  return status === 'approved';
}
