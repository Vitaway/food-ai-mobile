import { Link, useNavigate } from 'react-router-dom';
import { AttentionAlerts } from '@/components/coach/AttentionAlerts';
import { SmartCoachAlertsPanel } from '@/components/coach/SmartCoachAlertsPanel';
import { DashboardCharts, CoachStatPills } from '@/components/coach/DashboardCharts';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader, DashboardSectionTitle } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import { useCoachQueue, useCoachPastReviews, useCoachStats } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachPastReviewItem, CoachQueueItem } from '@/types';

export function OverviewPage() {
  const navigate = useNavigate();
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: stats, isLoading: statsLoading } = useCoachStats(cohortId ?? undefined);
  const { data: queue, isLoading: queueLoading } = useCoachQueue({
    cohortId: cohortId ?? undefined,
    sort: 'oldest',
  });
  const { data: pastReviews, isLoading: pastLoading } = useCoachPastReviews({ limit: 5 });
  const { data: analytics, isLoading: analyticsLoading } = useCoachAnalytics();

  const queueColumns: DataTableColumn<CoachQueueItem>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (item) => (
        <span className="font-semibold text-ash-grey-900">
          {formatCoachPatientLabel(
            item.client.patientId ?? item.meal.clientId,
            item.client.profile.displayName,
          )}
        </span>
      ),
    },
    {
      key: 'meal',
      header: 'Meal',
      cell: (item) => (
        <div>
          <p className="font-medium text-ash-grey-900">{item.meal.mealName ?? 'Untitled meal'}</p>
          <p className="text-xs text-ash-grey-500">{formatMealType(item.meal.mealType)}</p>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (item) => (
        <span className="text-ash-grey-600">{formatRelativeTime(item.meal.submittedAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => <StatusBadge status={item.meal.status} />,
    },
  ];

  const historyColumns: DataTableColumn<CoachPastReviewItem>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (item) => (
        <span className="font-semibold text-ash-grey-900">
          {formatCoachPatientLabel(item.client.patientId, item.client.profile.displayName)}
        </span>
      ),
    },
    {
      key: 'meal',
      header: 'Meal',
      cell: (item) => (
        <span className="font-medium text-ash-grey-900">
          {item.review.mealName ?? item.meal.mealName ?? 'Untitled meal'}
        </span>
      ),
    },
    {
      key: 'reviewed',
      header: 'Reviewed',
      cell: (item) => (
        <span className="text-ash-grey-600">
          {item.review.reviewedAt ? formatRelativeTime(item.review.reviewedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      cell: (item) => <StatusBadge status={item.meal.status} />,
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Overview" actions={<CohortFilter />} />

      {statsLoading ? null : stats ? (
        <>
          <SmartCoachAlertsPanel />
          <AttentionAlerts stats={stats} />
          <KpiStrip
            items={[
              { label: 'In review', value: stats.inReview, warn: stats.inReview > 0 },
              { label: 'Analyzing', value: stats.analyzing },
              { label: 'Approved today', value: stats.approvedToday },
              { label: 'Flagged', value: stats.flagged, warn: stats.flagged > 0 },
              { label: 'Avg review', value: `${stats.avgReviewMinutes}m` },
            ]}
          />
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

      <DashboardPanel
        title="Needs review"
        action={
          <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
            View all →
          </Link>
        }>
        {queueLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading queue…</p>
        ) : (
          <DataTable
            columns={queueColumns}
            rows={(queue ?? []).slice(0, 5)}
            rowKey={(item) => item.meal.id}
            onRowClick={(item) => navigate(`/coach/queue/${item.meal.id}`)}
            emptyTitle="No meals waiting"
            emptyDescription="Your review queue is clear."
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Recent decisions"
        action={
          <Link to="/coach/history" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
            View all →
          </Link>
        }>
        {pastLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading…</p>
        ) : (
          <DataTable
            columns={historyColumns}
            rows={pastReviews ?? []}
            rowKey={(item) => item.meal.id}
            onRowClick={(item) => navigate(`/coach/history/${item.meal.id}`)}
            emptyTitle="No completed reviews yet"
            emptyDescription="Approved and rejected meals will show up here."
          />
        )}
      </DashboardPanel>

      {stats?.waitingOverHour != null && stats.waitingOverHour > 0 ? (
        <StatusPill tone="warn">{stats.waitingOverHour} meals waiting over an hour</StatusPill>
      ) : null}
    </div>
  );
}
