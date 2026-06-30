import { MEAL_STATUS_LABELS } from '@/constants/mealStatus';
import { cn } from '@/lib/utils';
import type { MealSubmissionStatus } from '@/types';

const styles: Record<MealSubmissionStatus, string> = {
  pending: 'bg-ash-grey-200 text-ash-grey-800',
  analyzing: 'bg-blue-spruce-100 text-blue-spruce-800',
  in_review: 'bg-cinnamon-wood-100 text-cinnamon-wood-700',
  approved: 'bg-shamrock-100 text-shamrock-800',
  rejected: 'bg-red-100 text-red-800',
};

export function StatusBadge({
  status,
  className,
}: {
  status: MealSubmissionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-normal uppercase tracking-wide',
        styles[status],
        className,
      )}>
      {MEAL_STATUS_LABELS[status]}
    </span>
  );
}

export function FlagBadge({ flagged }: { flagged: boolean }) {
  if (!flagged) return null;
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-normal text-red-800">
      Flagged
    </span>
  );
}
