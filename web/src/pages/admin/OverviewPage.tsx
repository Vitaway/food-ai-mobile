import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader, DashboardSectionTitle } from '@/components/layout/DashboardPageHeader';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import { useAdminMetrics, useAuditLogs, useAdminOperations } from '@/features/admin/hooks/useAdminQueries';
import { AdminGrowthChart } from '@/components/admin/AdminGrowthChart';
import { fetchAdminGrowth } from '@/features/admin/api/adminApi';
import { cn } from '@/lib/utils';

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'green' | 'orange' | 'blue';
}) {
  return (
    <Card className="overflow-hidden">
      <CardBody className="p-6">
        <p className="text-sm text-ash-grey-500">{label}</p>
        <p className="mt-2 text-3xl tracking-tight text-ash-grey-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-ash-grey-400">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}

export function AdminOverviewPage() {
  const { data: metrics, isLoading } = useAdminMetrics();
  const { data: ops, isLoading: opsLoading } = useAdminOperations();
  const { data: audit } = useAuditLogs();
  const { data: growth } = useQuery({ queryKey: ['admin', 'growth'], queryFn: () => fetchAdminGrowth(30) });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Overview" />

      {isLoading ? (
        <p className="text-ash-grey-500">Loading metrics…</p>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Coaches" value={metrics.coaches} accent="blue" />
          <MetricCard label="Consumers" value={metrics.consumers} accent="green" />
          <MetricCard
            label="Meals in review"
            value={metrics.meals.inReview}
            hint={`${metrics.meals.analyzing} analyzing`}
            accent="orange"
          />
          <MetricCard
            label="Vision API"
            value={metrics.vision.ok ? 'Online' : 'Check config'}
            hint={metrics.vision.model}
            accent={metrics.vision.ok ? 'green' : 'orange'}
          />
        </div>
      ) : null}

      {opsLoading ? (
        <p className="text-ash-grey-500">Loading operations metrics…</p>
      ) : ops ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Auto-approval rate"
              value={`${ops.autoApprovalRate}%`}
              hint="Approved without coach edits"
              accent="green"
            />
            <MetricCard
              label="Correction rate"
              value={`${ops.correctionRate}%`}
              hint="Coach changed AI nutrition"
              accent="orange"
            />
            <MetricCard
              label="Avg turnaround"
              value={`${ops.avgTurnaroundHours}h`}
              hint={`SLA target ${ops.slaTargetHours}h`}
              accent="blue"
            />
            <MetricCard
              label="Meals in review"
              value={ops.mealsInReview}
              hint={`${ops.consumers} active consumers`}
              accent="orange"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardBody>
                <DashboardSectionTitle title="Coach utilization" />
                <ul className="mt-4 space-y-3">
                  {ops.coachUtilization.map((coach) => (
                    <li key={coach.coachId}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ash-grey-800">{coach.displayName}</span>
                        <span className="text-ash-grey-500">
                          {coach.queueCount} queued · {coach.utilization}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
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
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <DashboardSectionTitle title="Auto-approval trend" />
                <ul className="mt-4 space-y-3">
                  {ops.autoApprovalTrend.map((week) => (
                    <li key={week.label} className="flex items-center justify-between text-sm">
                      <span className="text-ash-grey-600">{week.label}</span>
                      <span className="font-semibold text-ash-grey-900">
                        {week.rate}% <span className="font-normal text-ash-grey-400">({week.approved} meals)</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}

      {metrics?.payments || metrics?.reports || metrics?.totalUsers ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total users" value={metrics.totalUsers ?? 0} accent="blue" />
          <MetricCard label="Active this week" value={metrics.activeUsersWeek ?? 0} accent="green" />
          <MetricCard label="New registrations (7d)" value={metrics.newRegistrationsWeek ?? 0} accent="green" />
          <MetricCard
            label="Referral signups"
            value={metrics.userSources?.referral ?? 0}
            hint={`${metrics.userSources?.individual ?? 0} individual · ${metrics.userSources?.company ?? 0} company`}
            accent="blue"
          />
        </div>
      ) : null}

      {growth?.length ? <AdminGrowthChart points={growth} /> : null}

      {metrics?.payments || metrics?.reports ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Revenue"
            value={metrics.payments?.revenue ?? 0}
            accent="green"
          />
          <MetricCard
            label="Active subscriptions"
            value={metrics.payments?.activeSubscriptions ?? 0}
            accent="green"
          />
          <MetricCard
            label="Pending payments"
            value={metrics.payments?.pendingPayments ?? 0}
            accent="orange"
          />
          <MetricCard
            label="Failed payments"
            value={metrics.payments?.failedPayments ?? 0}
            accent="orange"
          />
          <MetricCard
            label="Report snapshots"
            value={metrics.reports?.totalSnapshots ?? 0}
            accent="blue"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <DashboardSectionTitle title="Meal pipeline" />
            {metrics ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">Total submissions</dt>
                  <dd className="font-semibold text-ash-grey-900">{metrics.meals.total}</dd>
                </div>
                <div className="flex justify-between border-b border-ash-grey-100 pb-2">
                  <dt className="text-ash-grey-500">In review</dt>
                  <dd className="font-semibold text-cinnamon-wood-500">{metrics.meals.inReview}</dd>
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
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <DashboardSectionTitle
              title="Recent activity"
              action={
                <Link to={ADMIN_ROUTES.system} className="text-sm text-blue-spruce-600 hover:underline">
                  System →
                </Link>
              }
            />
            {audit?.length ? (
              <ul className="space-y-3">
                {audit.slice(0, 6).map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3 text-sm">
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
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
