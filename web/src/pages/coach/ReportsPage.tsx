import { useQuery } from '@tanstack/react-query';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
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

  const columns: DataTableColumn<CoachReportSnapshot>[] = [
    {
      key: 'period',
      header: 'Period',
      cell: (report) => (
        <div>
          <p className="font-semibold capitalize text-ash-grey-900">{report.period} report</p>
          <p className="text-xs text-ash-grey-500">
            {new Date(report.periodStart).toLocaleDateString()} –{' '}
            {new Date(report.periodEnd).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'org',
      header: 'Organization',
      cell: (report) => {
        const organization = metricValue(report.metrics, ['organization']);
        return organization ? (
          <span className="text-ash-grey-700">{organization}</span>
        ) : (
          <span className="text-ash-grey-400">—</span>
        );
      },
    },
    {
      key: 'reviews',
      header: 'Reviews',
      cell: (report) => (
        <StatusPill tone="info">
          {metricValue(report.metrics, ['coachActivity', 'reviewsCompleted']) ?? '0'}
        </StatusPill>
      ),
    },
    {
      key: 'approved',
      header: 'Approved',
      cell: (report) => (
        <StatusPill tone="good">
          {metricValue(report.metrics, ['coachActivity', 'mealsApproved']) ?? '0'}
        </StatusPill>
      ),
    },
    {
      key: 'queue',
      header: 'In queue',
      cell: (report) => (
        <span className="text-ash-grey-700">
          {metricValue(report.metrics, ['coachActivity', 'mealsInQueue']) ?? '0'}
        </span>
      ),
    },
    {
      key: 'generated',
      header: 'Generated',
      cell: (report) => (
        <span className="text-xs text-ash-grey-500">
          {new Date(report.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Export',
      cell: (report) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ReportDownloadActions
            report={{
              ...report,
              variant: 'coach',
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Reports" />

      <DashboardPanel title="Weekly reports">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading reports…</p>
        ) : error ? (
          <p className="px-3 py-8 text-sm text-red-600">Unable to load reports right now.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={reports}
            rowKey={(r) => r.id}
            emptyTitle="No reports yet"
            emptyDescription="Reports are generated automatically each week."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
