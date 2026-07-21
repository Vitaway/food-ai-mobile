import { Link, useParams } from 'react-router-dom';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { PastReviewDetailPanel } from '@/components/coach/PastReviewDetailPanel';
import { StatusBadge } from '@/components/ui/Badge';
import { useCoachMeal } from '@/hooks/useCoachQueries';
import { formatMealType, formatRelativeTime, resolveCoachMealTitle } from '@/lib/utils';

export function PastReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError } = useCoachMeal(id ?? null);

  if (isLoading) {
    return <p className="text-ash-grey-500">Loading review…</p>;
  }

  if (isError || !item) {
    return (
      <div className="rounded-[1.75rem] border border-ash-grey-100 bg-white/95 p-8 text-center shadow-[0_12px_32px_rgba(2,52,89,0.06)]">
        <p className="font-semibold text-ash-grey-800">Review not found</p>
        <Link to="/coach/history" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to review history
        </Link>
      </div>
    );
  }

  if (item.meal.status === 'in_review') {
    return (
      <div className="rounded-[1.75rem] border border-ash-grey-100 bg-white/95 p-8 text-center shadow-[0_12px_32px_rgba(2,52,89,0.06)]">
        <p className="font-semibold text-ash-grey-800">This meal is still waiting for review</p>
        <Link
          to={`/coach/queue/${item.meal.id}`}
          className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          Open in review queue →
        </Link>
      </div>
    );
  }

  const { meal } = item;
  const title = resolveCoachMealTitle({
    mealName: meal.coachReview?.mealName || meal.mealName,
    aiMealName: meal.aiAnalysis?.mealName,
    mealType: meal.mealType,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-ash-grey-100 bg-white/90 px-4 py-3 shadow-[0_8px_24px_rgba(2,52,89,0.05)] sm:px-5">
        <Link
          to="/coach/history"
          className="text-sm font-semibold text-blue-spruce-700 transition hover:text-blue-spruce-900">
          ← Review history
        </Link>
        <span className="hidden h-4 w-px bg-ash-grey-200 sm:block" aria-hidden />
        <h1 className="font-sans text-base font-semibold tracking-tight text-ash-grey-900 sm:text-lg">
          {title}
        </h1>
        <StatusBadge status={meal.status} />
        <span className="text-sm text-ash-grey-500">
          {formatMealType(meal.mealType)} · Submitted {formatRelativeTime(meal.submittedAt)}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <PastReviewDetailPanel item={item} />
        <div className="xl:sticky xl:top-4">
          <ClientPanel client={item.client} showPreferences />
        </div>
      </div>
    </div>
  );
}
