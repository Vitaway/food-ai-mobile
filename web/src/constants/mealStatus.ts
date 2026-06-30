import type { MealSubmissionStatus } from '@/types';

export const MEAL_STATUS_LABELS: Record<MealSubmissionStatus, string> = {
  pending: 'Pending',
  analyzing: 'Analyzing',
  in_review: 'In review',
  approved: 'Ready',
  rejected: 'Rejected',
};

export const HEALTH_FLAG_STYLES = {
  green: 'bg-shamrock-100 text-shamrock-800',
  yellow: 'bg-cinnamon-wood-100 text-cinnamon-wood-700',
  orange: 'bg-cinnamon-wood-200 text-cinnamon-wood-800',
  red: 'bg-red-100 text-red-800',
} as const;
