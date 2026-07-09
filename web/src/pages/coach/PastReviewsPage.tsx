import { useState } from 'react';
import { PastReviewCard } from '@/components/coach/PastReviewCard';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { useCoachPastReviews } from '@/hooks/useCoachQueries';

export function PastReviewsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<'all' | 'approve' | 'reject'>('all');
  const { data: reviews, isLoading } = useCoachPastReviews({
    search: search || undefined,
    action: action === 'all' ? undefined : action,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Review history" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search patient ID or meal name…"
          className="flex-1 rounded-2xl border border-ash-grey-200 px-4 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-2xl border border-ash-grey-200 px-4 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={action}
          onChange={(e) => setAction(e.target.value as typeof action)}>
          <option value="all">All reviews</option>
          <option value="approve">Approved only</option>
          <option value="reject">Rejected only</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading reviews…</p>
      ) : reviews?.length ? (
        <div className="space-y-4">
          {reviews.map((item) => (
            <PastReviewCard key={item.meal.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-lg font-semibold text-ash-grey-800">No review history yet</p>
            <p className="mt-1 text-ash-grey-500">
              Approved and rejected meals will show up here with your saved adjustments.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
