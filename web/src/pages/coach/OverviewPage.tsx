import { Link } from 'react-router-dom';
import { StatsGrid } from '@/components/coach/ClientPanel';
import { DashboardCharts } from '@/components/coach/DashboardCharts';
import { QueueCard } from '@/components/coach/QueueCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { useCoachQueue, useCoachStats } from '@/hooks/useCoachQueries';

export function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useCoachStats();
  const { data: queue, isLoading: queueLoading } = useCoachQueue();
  const { data: analytics, isLoading: analyticsLoading } = useCoachAnalytics();
  const { data: profile } = useCoachProfile();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Coach';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-spruce-700 via-blue-spruce-600 to-blue-spruce-500 p-6 text-white shadow-lg sm:p-8">
        <p className="text-white/80">Good day, {firstName}</p>
        <h2 className="mt-1 text-3xl tracking-tight">Overview</h2>
        <p className="mt-2 max-w-xl text-white/85">
          Review client meals waiting for approval. Meals stay hidden on mobile until you approve.
        </p>
        <Button to="/coach/queue" variant="primary" size="md" className="mt-5">
          Open review queue →
        </Button>
      </div>

      {statsLoading ? null : stats ? <StatsGrid stats={stats} /> : null}

      {analyticsLoading ? (
        <p className="text-ash-grey-500">Loading charts…</p>
      ) : analytics ? (
        <div>
          <h3 className="mb-4 text-xl font-bold text-ash-grey-900">Performance insights</h3>
          <DashboardCharts analytics={analytics} />
        </div>
      ) : null}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-ash-grey-900">Needs review</h3>
          <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
            View all
          </Link>
        </div>

        {queueLoading ? (
          <p className="text-ash-grey-500">Loading queue…</p>
        ) : queue?.length ? (
          <div className="space-y-4">
            {queue.slice(0, 3).map((item) => (
              <QueueCard key={item.meal.id} item={item} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="py-12 text-center text-ash-grey-500">
              No meals waiting for review 🎉
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
