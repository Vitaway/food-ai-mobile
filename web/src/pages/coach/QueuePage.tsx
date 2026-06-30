import { QueueCard } from '@/components/coach/QueueCard';
import { Card, CardBody } from '@/components/ui/Card';
import { useCoachQueue } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';

export function QueuePage() {
  const filter = useCoachStore((s) => s.filter);
  const setFilter = useCoachStore((s) => s.setFilter);
  const { data: queue, isLoading } = useCoachQueue();

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl tracking-tight text-ash-grey-900">Review queue</h2>
        <p className="mt-1 text-ash-grey-600">Meals in coach review — nutrition hidden on mobile until approved.</p>
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
