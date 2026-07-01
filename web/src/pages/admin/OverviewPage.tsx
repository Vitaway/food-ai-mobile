import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import { useAdminMetrics, useAuditLogs } from '@/features/admin/hooks/useAdminQueries';
import { cn } from '@/lib/utils';

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'green' | 'orange' | 'blue';
}) {
  const accentClass =
    accent === 'green'
      ? 'from-shamrock-500 to-shamrock-600'
      : accent === 'orange'
        ? 'from-cinnamon-wood-400 to-cinnamon-wood-500'
        : 'from-blue-spruce-600 to-blue-spruce-700';

  return (
    <Card className="overflow-hidden">
      <div className={cn('h-1 bg-gradient-to-r', accentClass)} />
      <CardBody>
        <p className="text-sm text-ash-grey-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-ash-grey-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-ash-grey-400">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}

export function AdminOverviewPage() {
  const { data: metrics, isLoading } = useAdminMetrics();
  const { data: audit } = useAuditLogs();
  const firstName = 'Admin';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-spruce-900 via-blue-spruce-800 to-blue-spruce-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-white/75">Platform control</p>
        <h2 className="mt-1 text-3xl tracking-tight">Hello, {firstName}</h2>
        <p className="mt-2 max-w-2xl text-white/85">
          Oversee coaches, consumers, and the meal review pipeline across the entire MiraFood platform.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button to={ADMIN_ROUTES.coaches} variant="primary" size="md">
            Manage coaches →
          </Button>
          <Button to={ADMIN_ROUTES.users} variant="outline-light" size="md">
            View consumers
          </Button>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="text-xl font-bold text-ash-grey-900">Meal pipeline</h3>
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
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-ash-grey-900">Recent activity</h3>
              <Link to={ADMIN_ROUTES.system} className="text-sm text-blue-spruce-600 hover:underline">
                System →
              </Link>
            </div>
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
