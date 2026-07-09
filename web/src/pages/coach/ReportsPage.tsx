import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { ReportDownloadActions } from '@/components/reports/ReportDownloadActions';
import { fetchCoachReports, type CoachReportSnapshot } from '@/api/coachApi';

function metricValue(metrics: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = metrics;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current != null ? String(current) : null;
}

export function ReportsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'reports'],
    queryFn: fetchCoachReports,
  });

  const reports = data ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Reports" />

      {isLoading ? <p className="text-sm text-ash-grey-500">Loading reports...</p> : null}
      {error ? (
        <p className="text-sm text-red-600">Unable to load reports right now.</p>
      ) : null}

      {!isLoading && !error && reports.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ash-grey-600">
              No reports yet. Reports are generated automatically each week.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {reports.map((report: CoachReportSnapshot) => {
        const reviews = metricValue(report.metrics, ['coachActivity', 'reviewsCompleted']);
        const approved = metricValue(report.metrics, ['coachActivity', 'mealsApproved']);
        const inQueue = metricValue(report.metrics, ['coachActivity', 'mealsInQueue']);
        const organization = metricValue(report.metrics, ['organization']);

        return (
          <Card key={report.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-blue-spruce-600">
                    {report.period} report
                  </p>
                  <p className="mt-1 text-sm text-ash-grey-600">
                    {new Date(report.periodStart).toLocaleDateString()} –{' '}
                    {new Date(report.periodEnd).toLocaleDateString()}
                  </p>
                  {organization ? (
                    <p className="mt-1 text-sm text-ash-grey-500">{organization}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ReportDownloadActions
                    report={{
                      ...report,
                      variant: 'coach',
                    }}
                  />
                  <p className="text-xs text-ash-grey-400">
                    Generated {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
                  <p className="text-xs text-ash-grey-500">Reviews completed</p>
                  <p className="text-2xl font-bold text-ash-grey-900">{reviews ?? '0'}</p>
                </div>
                <div className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
                  <p className="text-xs text-ash-grey-500">Meals approved</p>
                  <p className="text-2xl font-bold text-ash-grey-900">{approved ?? '0'}</p>
                </div>
                <div className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
                  <p className="text-xs text-ash-grey-500">In review queue</p>
                  <p className="text-2xl font-bold text-ash-grey-900">{inQueue ?? '0'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
