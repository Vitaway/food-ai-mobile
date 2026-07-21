import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminGrowthChart } from '@/components/admin/AdminGrowthChart';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { Button } from '@/components/ui/Button';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import { useAuth } from '@/features/auth';
import {
  useAdminMetrics,
  useAuditLogs,
  useAdminOperations,
} from '@/features/admin/hooks/useAdminQueries';
import { fetchAdminGrowth } from '@/features/admin/api/adminApi';
import { cn } from '@/lib/utils';

function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(displayName?: string | null) {
  const trimmed = displayName?.trim();
  if (!trimmed) return 'Admin';
  return trimmed.split(/\s+/)[0] ?? 'Admin';
}

export function AdminOverviewPage() {
  const { user } = useAuth();
  const { data: metrics, isLoading } = useAdminMetrics();
  const { data: ops, isLoading: opsLoading } = useAdminOperations();
  const { data: audit } = useAuditLogs();
  const { data: growth } = useQuery({
    queryKey: ['admin', 'growth'],
    queryFn: () => fetchAdminGrowth(30),
  });

  const name = firstName(user?.displayName);
  const inReview = metrics?.meals.inReview ?? ops?.mealsInReview ?? 0;
  const summaryParts = [
    inReview > 0
      ? `${inReview} meal${inReview === 1 ? '' : 's'} in review`
      : 'review pipeline clear',
    metrics?.vision.ok ? 'vision online' : 'vision needs attention',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-ash-grey-900 sm:text-4xl">
            {greetingForNow()}, {name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-grey-600 sm:text-base">
            Platform pulse: {summaryParts.join(' · ')}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button to={ADMIN_ROUTES.users} variant="outline" size="md">
            Users & roles
          </Button>
          <Button to={ADMIN_ROUTES.system} variant="primary" size="md">
            System health
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading metrics…</p>
      ) : metrics ? (
        <KpiStrip
          columns={4}
          items={[
            {
              label: 'Coaches',
              value: metrics.coaches,
              tone: 'info',
              caption: 'Active coaching seats',
            },
            {
              label: 'Consumers',
              value: metrics.consumers,
              tone: 'success',
              caption: 'Patients on platform',
            },
            {
              label: 'In review',
              value: metrics.meals.inReview,
              tone: 'accent',
              warn: metrics.meals.inReview > 0,
              caption: `${metrics.meals.analyzing} analyzing`,
            },
            {
              label: 'Vision API',
              value: metrics.vision.ok ? 'Online' : 'Check',
              tone: metrics.vision.ok ? 'success' : 'warn',
              warn: !metrics.vision.ok,
              caption: metrics.vision.model,
            },
          ]}
        />
      ) : null}

      {!opsLoading && ops ? (
        <KpiStrip
          columns={4}
          items={[
            {
              label: 'Auto-approval',
              value: `${ops.autoApprovalRate}%`,
              tone: 'success',
              caption: 'Approved without edits',
            },
            {
              label: 'Correction rate',
              value: `${ops.correctionRate}%`,
              tone: 'accent',
              caption: 'Coach changed AI nutrition',
            },
            {
              label: 'Avg turnaround',
              value: `${ops.avgTurnaroundHours}h`,
              tone: 'info',
              caption: `SLA target ${ops.slaTargetHours}h`,
            },
            {
              label: 'Active consumers',
              value: ops.consumers,
              tone: 'default',
              caption: `${ops.mealsInReview} meals waiting`,
            },
          ]}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.9fr)] xl:items-start">
        <div className="min-w-0 space-y-5">
          {growth?.length ? (
            <div className="rounded-[1.75rem] border border-ash-grey-100 bg-white/95 p-5 shadow-[0_12px_32px_rgba(2,52,89,0.06)]">
              <AdminGrowthChart points={growth} />
            </div>
          ) : null}

          {!opsLoading && ops ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <DashboardPanel
                className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
                title="Coach utilization"
                bodyClassName="px-4 py-4 sm:px-5">
                <ul className="space-y-3">
                  {ops.coachUtilization.map((coach) => (
                    <li key={coach.coachId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ash-grey-800">{coach.displayName}</span>
                        <span className="text-ash-grey-500">
                          {coach.queueCount} queued · {coach.utilization}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-ash-grey-100">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            coach.utilization >= 80
                              ? 'bg-red-500'
                              : coach.utilization >= 50
                                ? 'bg-cinnamon-wood-400'
                                : 'bg-shamrock-500',
                          )}
                          style={{ width: `${coach.utilization}%` }}
                        />
                      </div>
                    </li>
                  ))}
                  {!ops.coachUtilization.length ? (
                    <p className="text-sm text-ash-grey-500">No coach utilization data yet.</p>
                  ) : null}
                </ul>
              </DashboardPanel>

              <DashboardPanel
                className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
                title="Auto-approval trend"
                bodyClassName="px-4 py-4 sm:px-5">
                <ul className="space-y-3">
                  {ops.autoApprovalTrend.map((week) => (
                    <li key={week.label} className="flex items-center justify-between text-sm">
                      <span className="text-ash-grey-600">{week.label}</span>
                      <span className="font-semibold text-ash-grey-900">
                        {week.rate}%{' '}
                        <span className="font-normal text-ash-grey-400">({week.approved} meals)</span>
                      </span>
                    </li>
                  ))}
                  {!ops.autoApprovalTrend.length ? (
                    <p className="text-sm text-ash-grey-500">No trend data yet.</p>
                  ) : null}
                </ul>
              </DashboardPanel>
            </div>
          ) : null}

          {metrics?.payments || metrics?.reports ? (
            <KpiStrip
              columns={5}
              items={[
                {
                  label: 'Revenue',
                  value: metrics.payments?.revenue ?? 0,
                  tone: 'success',
                },
                {
                  label: 'Subscriptions',
                  value: metrics.payments?.activeSubscriptions ?? 0,
                  tone: 'info',
                },
                {
                  label: 'Pending pay',
                  value: metrics.payments?.pendingPayments ?? 0,
                  tone: 'accent',
                  warn: (metrics.payments?.pendingPayments ?? 0) > 0,
                },
                {
                  label: 'Failed pay',
                  value: metrics.payments?.failedPayments ?? 0,
                  tone: 'warn',
                  warn: (metrics.payments?.failedPayments ?? 0) > 0,
                },
                {
                  label: 'Report snaps',
                  value: metrics.reports?.totalSnapshots ?? 0,
                  tone: 'default',
                },
              ]}
            />
          ) : null}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6">
          {metrics ? (
            <DashboardPanel
              className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
              title="Meal pipeline"
              bodyClassName="px-4 py-4 sm:px-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">Total submissions</dt>
                  <dd className="font-semibold text-ash-grey-900">{metrics.meals.total}</dd>
                </div>
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">In review</dt>
                  <dd className="font-semibold text-cinnamon-wood-600">{metrics.meals.inReview}</dd>
                </div>
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">Analyzing</dt>
                  <dd className="font-semibold text-ash-grey-900">{metrics.meals.analyzing}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash-grey-500">Approved</dt>
                  <dd className="font-semibold text-shamrock-600">{metrics.meals.approved}</dd>
                </div>
              </dl>
            </DashboardPanel>
          ) : null}

          {metrics?.totalUsers != null ? (
            <DashboardPanel
              className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
              title="User growth"
              bodyClassName="px-4 py-4 sm:px-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">Total users</dt>
                  <dd className="font-semibold text-ash-grey-900">{metrics.totalUsers ?? 0}</dd>
                </div>
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">Active this week</dt>
                  <dd className="font-semibold text-shamrock-700">{metrics.activeUsersWeek ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash-grey-500">New registrations (7d)</dt>
                  <dd className="font-semibold text-blue-spruce-700">{metrics.newRegistrationsWeek ?? 0}</dd>
                </div>
              </dl>
            </DashboardPanel>
          ) : null}

          <DashboardPanel
            className="rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]"
            title="Recent activity"
            action={
              <Link to={ADMIN_ROUTES.system} className="text-sm font-semibold text-blue-spruce-600 hover:underline">
                System →
              </Link>
            }
            bodyClassName="px-4 py-4 sm:px-5">
            {audit?.length ? (
              <ul className="space-y-3">
                {audit.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50/80 px-4 py-3 text-sm">
                    <p className="font-medium text-ash-grey-900">{entry.action}</p>
                    <p className="mt-0.5 text-xs text-ash-grey-500">
                      {new Date(entry.createdAt).toLocaleString()}
                      {entry.targetId ? ` · ${entry.targetId}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ash-grey-500">No admin actions logged yet.</p>
            )}
          </DashboardPanel>
        </aside>
      </div>
    </div>
  );
}
