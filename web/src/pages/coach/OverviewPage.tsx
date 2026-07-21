import { Link, useNavigate } from 'react-router-dom';
import { AttentionAlerts } from '@/components/coach/AttentionAlerts';
import { SmartCoachAlertsPanel } from '@/components/coach/SmartCoachAlertsPanel';
import { DashboardCharts } from '@/components/coach/DashboardCharts';
import { OverviewStatCards } from '@/components/coach/OverviewStatCards';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCoachAnalytics } from '@/hooks/useCoachAnalytics';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { useCoachQueue, useCoachPastReviews, useCoachStats } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachPastReviewItem, CoachQueueItem } from '@/types';

function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(displayName?: string | null) {
  const trimmed = displayName?.trim();
  if (!trimmed) return 'Coach';
  return trimmed.split(/\s+/)[0] ?? 'Coach';
}

function sparkFromTrend(values: number[], fallbackLength = 7) {
  if (values.length) return values.slice(-7);
  return Array.from({ length: fallbackLength }, (_, index) => Math.max(1, index + 1));
}

export function OverviewPage() {
  const navigate = useNavigate();
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: profile } = useCoachProfile();
  const { data: stats, isLoading: statsLoading } = useCoachStats(cohortId ?? undefined);
  const { data: queue, isLoading: queueLoading } = useCoachQueue({
    cohortId: cohortId ?? undefined,
    sort: 'oldest',
  });
  const { data: pastReviews, isLoading: pastLoading } = useCoachPastReviews({ limit: 5 });
  const { data: analytics, isLoading: analyticsLoading } = useCoachAnalytics();

  const name = firstName(profile?.displayName);
  const inReview = stats?.inReview ?? 0;
  const unread = stats?.unreadMessages ?? 0;
  const summaryParts = [
    inReview > 0 ? `${inReview} meal${inReview === 1 ? '' : 's'} waiting for review` : 'queue is clear',
    unread > 0 ? `${unread} unread message${unread === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-ash-grey-900 sm:text-4xl">
            {greetingForNow()}, {name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-grey-600 sm:text-base">
            You have {summaryParts.join(' · ')}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CohortFilter />
          <Button to="/coach/queue" variant="primary" size="md">
            Open queue
          </Button>
        </div>
      </div>

      {!statsLoading && stats ? (
        <OverviewStatCards
          cards={[
            {
              label: 'Active clients',
              value: analytics?.coachStats.activeClients ?? '—',
              delta:
                (stats.inactiveClients ?? 0) > 0
                  ? `${stats.inactiveClients} inactive 3+ days`
                  : 'Caseload looking healthy',
              deltaPositive: (stats.inactiveClients ?? 0) === 0,
              href: '/coach/clients',
              tone: 'mint',
              spark: sparkFromTrend(
                analytics?.reviewsThisWeek.map((point) => point.value) ?? [2, 3, 4, 3, 5, 4, 6],
              ),
            },
            {
              label: 'In review now',
              value: stats.inReview,
              delta:
                (stats.waitingOverHour ?? 0) > 0
                  ? `${stats.waitingOverHour} waiting over 1h`
                  : `${stats.approvedToday} approved today`,
              deltaPositive: (stats.waitingOverHour ?? 0) === 0,
              href: '/coach/queue',
              tone: 'peach',
              spark: sparkFromTrend(
                analytics?.approvalTrend.map((point) => point.value) ?? [40, 55, 48, 62, 70, 66, 78],
              ),
            },
            {
              label: 'Avg review time',
              value: `${stats.avgReviewMinutes}m`,
              delta:
                stats.flagged > 0
                  ? `${stats.flagged} flagged meal${stats.flagged === 1 ? '' : 's'}`
                  : `${analytics?.coachStats.approvalRate ?? '—'}% approval rate`,
              deltaPositive: stats.flagged === 0,
              href: '/coach/history',
              tone: 'sky',
              spark: sparkFromTrend(
                analytics?.reviewsByMealType.map((point) => point.value) ?? [3, 5, 4, 6, 5, 7, 8],
              ),
            },
          ]}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] xl:items-start">
        <div className="min-w-0 space-y-5">
          {analyticsLoading ? (
            <p className="text-ash-grey-500">Loading charts…</p>
          ) : analytics ? (
            <DashboardCharts analytics={analytics} />
          ) : null}

          <DashboardPanel
            className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
            title="Needs review"
            action={
              <Link
                to="/coach/queue"
                className="text-sm font-semibold text-blue-spruce-600 hover:underline">
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
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6">
          {stats ? <AttentionAlerts stats={stats} className="min-h-0" /> : null}
          <SmartCoachAlertsPanel className="min-h-0" />
          <DashboardPanel
            className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
            title="Recent decisions"
            action={
              <Link
                to="/coach/history"
                className="text-sm font-semibold text-blue-spruce-600 hover:underline">
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
        </aside>
      </div>
    </div>
  );
}
