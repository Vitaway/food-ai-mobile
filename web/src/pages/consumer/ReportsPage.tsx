import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  fetchConsumerReports,
  generateConsumerReport,
  type ConsumerReportSnapshot,
} from '@/features/consumer/api/consumerApi';
import { downloadReportPdf } from '@/lib/reportExport';
import type { ExportableReport } from '@/types/reports';

function toExportable(report: ConsumerReportSnapshot): ExportableReport {
  return {
    id: report.id,
    variant: 'consumer',
    period: report.period,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    metrics: report.metrics,
    createdAt: report.createdAt,
  };
}

export function ConsumerReportsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['consumer', 'reports'],
    queryFn: fetchConsumerReports,
  });

  const generate = useMutation({
    mutationFn: () => generateConsumerReport('weekly'),
    onSuccess: () => {
      toast.success('Weekly report generated');
      void qc.invalidateQueries({ queryKey: ['consumer', 'reports'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not generate report')),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl tracking-tight text-ash-grey-900">Reports</h2>
          <p className="mt-1 text-ash-grey-600">
            Weekly nutrition summaries — same reports as in the mobile app.
          </p>
        </div>
        <Button
          type="button"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}>
          {generate.isPending ? 'Generating…' : 'Generate weekly report'}
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-ash-grey-500">Loading reports…</p> : null}

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold capitalize text-ash-grey-900">{report.period} report</p>
                <p className="text-sm text-ash-grey-600">
                  {new Date(report.periodStart).toLocaleDateString()} –{' '}
                  {new Date(report.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadingId === report.id}
                onClick={() => {
                  setDownloadingId(report.id);
                  void downloadReportPdf(toExportable(report))
                    .then(() => toast.success('Report downloaded'))
                    .catch((err) =>
                      toast.error(getApiErrorMessage(err, 'Could not download report')),
                    )
                    .finally(() => setDownloadingId(null));
                }}>
                {downloadingId === report.id ? 'Preparing…' : 'Download PDF'}
              </Button>
            </CardBody>
          </Card>
        ))}
        {!isLoading && !reports.length ? (
          <p className="text-sm text-ash-grey-500">No reports yet. Generate your first weekly report.</p>
        ) : null}
      </div>
    </div>
  );
}
