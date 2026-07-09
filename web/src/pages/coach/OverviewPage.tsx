import { Link } from 'react-router-dom';
import { PastReviewCard } from '@/components/coach/PastReviewCard';
import { AttentionAlerts } from '@/components/coach/AttentionAlerts';
import { SmartCoachAlertsPanel } from '@/components/coach/SmartCoachAlertsPanel';
import { StatsGrid } from '@/components/coach/ClientPanel';
import { DashboardCharts, CoachStatPills } from '@/components/coach/DashboardCharts';
import { QueueCard } from '@/components/coach/QueueCard';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader, DashboardSectionTitle } from '@/components/layout/DashboardPageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import { useCoachQueue, useCoachPastReviews, useCoachStats } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';

export function OverviewPage() {
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: stats, isLoading: statsLoading } = useCoachStats(cohortId ?? undefined);
  const { data: queue, isLoading: queueLoading } = useCoachQueue({
    cohortId: cohortId ?? undefined,
    sort: 'oldest',
  });
  const { data: pastReviews, isLoading: pastLoading } = useCoachPastReviews({ limit: 5 });
  const { data: analytics, isLoading: analyticsLoading } = useCoachAnalytics();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Overview"
        actions={<CohortFilter />}
      />

      {statsLoading ? null : stats ? (
        <>
          <SmartCoachAlertsPanel />
          <AttentionAlerts stats={stats} />
          <StatsGrid stats={stats} />
        </>
      ) : null}

      {analyticsLoading ? (
        <p className="text-ash-grey-500">Loading charts…</p>
      ) : analytics ? (
        <div>
          <DashboardSectionTitle title="Your performance" />
          <CoachStatPills stats={analytics.coachStats} />
          <div className="mt-4">
            <DashboardCharts analytics={analytics} />
          </div>
        </div>
      ) : null}

      <div>
        <DashboardSectionTitle
          title="Review history"
          action={
            <Link to="/coach/history" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
              View all
            </Link>
          }
        />

        {pastLoading ? (
          <p className="text-ash-grey-500">Loading…</p>
        ) : pastReviews?.length ? (
          <div className="space-y-4">
            {pastReviews.map((item) => (
              <PastReviewCard key={item.meal.id} item={item} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="py-8 text-center text-ash-grey-500">
              No completed reviews yet.
            </CardBody>
          </Card>
        )}
      </div>

      <div>
        <DashboardSectionTitle
          title="Needs review"
          action={
            <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
              View all
            </Link>
          }
        />

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
            <CardBody className="py-12 text-center">
              <p className="text-ash-grey-500">No meals waiting for review 🎉</p>
              <Link to="/coach/clients" className="mt-2 inline-block text-sm text-blue-spruce-600 hover:underline">
                Check inactive clients →
              </Link>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
