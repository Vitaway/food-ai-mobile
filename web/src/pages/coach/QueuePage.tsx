import { QueueCard } from '@/components/coach/QueueCard';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { useCoachOperations, useCoachQueue } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { cn } from '@/lib/utils';

export function QueuePage() {
  const filter = useCoachStore((s) => s.filter);
  const setFilter = useCoachStore((s) => s.setFilter);
  const queueSearch = useCoachStore((s) => s.queueSearch);
  const setQueueSearch = useCoachStore((s) => s.setQueueSearch);
  const queueSort = useCoachStore((s) => s.queueSort);
  const setQueueSort = useCoachStore((s) => s.setQueueSort);
  const cohortId = useCoachStore((s) => s.cohortId);

  const { data: queue, isLoading } = useCoachQueue({
    search: queueSearch || undefined,
    sort: queueSort,
    cohortId: cohortId ?? undefined,
  });
  const { data: ops } = useCoachOperations();

  const filtered = queue?.filter((item) => {
    if (filter === 'flagged') return item.meal.fraudCheckResult === 'flag';
    if (filter === 'low_confidence') return (item.meal.confidenceAvg ?? 1) < 0.8;
    return true;
  });

  const filters = [
    { id: 'all' as const, label: 'All' },
    { id: 'flagged' as const, label: 'Flagged' },
    { id: 'low_confidence' as const, label: 'Low confidence' },
  ];

  const sortOptions = [
    { id: 'sla_urgency' as const, label: 'SLA urgency' },
    { id: 'oldest' as const, label: 'Oldest first' },
    { id: 'newest' as const, label: 'Newest first' },
    { id: 'flagged' as const, label: 'Flagged first' },
    { id: 'low_confidence' as const, label: 'Low confidence' },
  ];

  const kpiItems = [
    { label: 'Pending review', value: ops?.pendingReview ?? queue?.length ?? 0 },
    { label: 'Near SLA', value: ops?.nearSla ?? 0, warn: (ops?.nearSla ?? 0) > 0 },
    { label: 'Correction rate', value: ops ? `${ops.correctionRate}%` : '—' },
    { label: 'Auto-approval (week)', value: ops ? `${ops.autoApprovalRateWeek}%` : '—' },
    { label: 'Avg turnaround', value: ops ? `${ops.avgTurnaroundHours}h` : '—' },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Review queue"
        actions={<CohortFilter />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpiItems.map((kpi) => (
          <Card key={kpi.label}>
            <CardBody className="py-4">
              <p className="text-xs text-ash-grey-500">{kpi.label}</p>
              <p className={cn('mt-1 text-2xl font-semibold', kpi.warn ? 'text-red-600' : 'text-ash-grey-900')}>
                {kpi.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search patient ID or meal name…"
          className="flex-1 rounded-2xl border border-ash-grey-200 px-4 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={queueSearch}
          onChange={(e) => setQueueSearch(e.target.value)}
        />
        <select
          className="rounded-2xl border border-ash-grey-200 px-4 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={queueSort}
          onChange={(e) => setQueueSort(e.target.value as typeof queueSort)}>
          {sortOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={
              filter === f.id
                ? 'rounded-full bg-blue-spruce-600 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-full border border-ash-grey-200 bg-white px-4 py-2 text-sm font-semibold text-ash-grey-700 hover:bg-ash-grey-50'
            }>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading…</p>
      ) : filtered?.length ? (
        <div className="space-y-4">
          {filtered.map((item) => (
            <QueueCard key={item.meal.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-lg font-semibold text-ash-grey-800">Queue is clear</p>
            <p className="mt-1 text-ash-grey-500">No meals match this filter.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
