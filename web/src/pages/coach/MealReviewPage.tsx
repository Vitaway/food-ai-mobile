import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { MealReviewPanel } from '@/components/coach/MealReviewPanel';
import { FlagBadge, StatusBadge } from '@/components/ui/Badge';
import { useCoachMeal, useReviewMeal } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { formatMealType, formatRelativeTime } from '@/lib/utils';

export function MealReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = useCoachMeal(id ?? null);
  const reviewMutation = useReviewMeal();
  const startReviewDraft = useCoachStore((s) => s.startReviewDraft);
  const clearReviewDraft = useCoachStore((s) => s.clearReviewDraft);
  const reviewDraft = useCoachStore((s) => s.reviewDraft);

  useEffect(() => {
    if (!item?.meal) return;
    startReviewDraft(item.meal.id, item.meal.mealName ?? '', item.meal.items ?? []);
    return () => clearReviewDraft();
  }, [item, clearReviewDraft, startReviewDraft]);

  async function handleAction(action: 'approve' | 'reject') {
    if (!item || !reviewDraft) return;
    await reviewMutation.mutateAsync({
      mealId: item.meal.id,
      action,
      note: reviewDraft.note || undefined,
      mealName: reviewDraft.mealName,
      items: reviewDraft.items,
    });
    navigate('/coach/queue');
  }

  if (isLoading) {
    return <p className="text-ash-grey-500">Loading meal…</p>;
  }

  if (isError || !item) {
    return (
      <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold text-ash-grey-800">Meal not found</p>
        <Link to="/coach/queue" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const { meal } = item;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Queue
        </Link>
        <StatusBadge status={meal.status} />
        <FlagBadge flagged={meal.fraudCheckResult === 'flag'} />
        <span className="text-sm text-ash-grey-500">
          {formatMealType(meal.mealType)} · {formatRelativeTime(meal.submittedAt)}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <MealReviewPanel
          item={item}
          onApprove={() => void handleAction('approve')}
          onReject={() => void handleAction('reject')}
          isSubmitting={reviewMutation.isPending}
        />
        <ClientPanel client={item.client} />
      </div>
    </div>
  );
}
