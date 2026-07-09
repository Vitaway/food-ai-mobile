import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { ReportDownloadActions } from '@/components/reports/ReportDownloadActions';
import { apiRequest } from '@/lib/apiClient';

type ReportsSummary = {
  count: number;
  snapshots?: Array<{
    id: string;
    period: string;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, unknown>;
    createdAt: string;
  }>;
  latest: {
    id: string;
    period: string;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, unknown>;
    createdAt: string;
  } | null;
};

export function AdminReportsPage() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'summary'],
    queryFn: () => apiRequest<ReportsSummary>('/reports/summary'),
  });
  const generate = useMutation({
    mutationFn: (period: 'weekly' | 'monthly') => apiRequest(`/reports/generate?period=${period}`, { method: 'POST' }),
    onSuccess: () => void refetch(),
  });

  const snapshots = data?.snapshots ?? (data?.latest ? [data.latest] : []);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Reports"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => generate.mutate('weekly')}>
              {generate.isPending ? 'Generating...' : 'Generate weekly'}
            </Button>
            <Button onClick={() => generate.mutate('monthly')}>
              {generate.isPending ? 'Generating...' : 'Generate monthly'}
            </Button>
          </div>
        }
      />
      {isLoading ? <p className="text-sm text-ash-grey-500">Loading reports...</p> : null}
      <Card>
        <CardBody>
          <p className="text-sm text-ash-grey-500">Total snapshots</p>
          <p className="text-3xl font-bold text-ash-grey-900">{data?.count ?? 0}</p>
        </CardBody>
      </Card>
      {snapshots.map((snapshot) => {
        const usage = snapshot.metrics.platformUsage as Record<string, number> | undefined;
        return (
          <Card key={snapshot.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-blue-spruce-700">{snapshot.period}</p>
                  <p className="mt-1 text-sm text-ash-grey-600">
                    {new Date(snapshot.periodStart).toLocaleDateString()} –{' '}
                    {new Date(snapshot.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <ReportDownloadActions
                  report={{
                    ...snapshot,
                    variant: 'admin',
                  }}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-ash-grey-50 px-3 py-2 text-sm">
                  Meals logged: {String(snapshot.metrics.mealCount ?? 0)}
                </div>
                <div className="rounded-xl bg-ash-grey-50 px-3 py-2 text-sm">
                  Approved: {String(snapshot.metrics.approvedMeals ?? 0)}
                </div>
                <div className="rounded-xl bg-ash-grey-50 px-3 py-2 text-sm">
                  Active clients: {String(usage?.uniqueClientsLogging ?? 0)}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
