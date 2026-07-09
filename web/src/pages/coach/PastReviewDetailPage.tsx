import { Link, useParams } from 'react-router-dom';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { PastReviewDetailPanel } from '@/components/coach/PastReviewDetailPanel';
import { StatusBadge } from '@/components/ui/Badge';
import { useCoachMeal } from '@/hooks/useCoachQueries';
import { formatMealType, formatRelativeTime } from '@/lib/utils';

export function PastReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError } = useCoachMeal(id ?? null);

  if (isLoading) {
    return <p className="text-ash-grey-500">Loading review…</p>;
  }

  if (isError || !item) {
    return (
      <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold text-ash-grey-800">Review not found</p>
        <Link to="/coach/history" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to review history
        </Link>
      </div>
    );
  }

  if (item.meal.status === 'in_review') {
    return (
      <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold text-ash-grey-800">This meal is still waiting for review</p>
        <Link to={`/coach/queue/${item.meal.id}`} className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          Open in review queue →
        </Link>
      </div>
    );
  }

  const { meal } = item;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/coach/history" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Review history
        </Link>
        <StatusBadge status={meal.status} />
        <span className="text-sm text-ash-grey-500">
          {formatMealType(meal.mealType)} · Submitted {formatRelativeTime(meal.submittedAt)}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <PastReviewDetailPanel item={item} />
        <ClientPanel client={item.client} showPreferences />
      </div>
    </div>
  );
}
