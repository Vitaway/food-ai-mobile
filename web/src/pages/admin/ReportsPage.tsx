import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CalendarIcon, FilePdfIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { apiRequest } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type ReportSnapshot = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

type GenerateResponse = {
  platform: ReportSnapshot;
};

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: toInputDate(from), to: toInputDate(to) };
}

function metricNum(metrics: Record<string, unknown>, key: string): number {
  const n = Number(metrics[key]);
  return Number.isFinite(n) ? n : 0;
}

function PipelineBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: 'green' | 'orange' | 'red';
}) {
  const pct = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ash-grey-600">{label}</span>
        <span className="font-semibold text-ash-grey-900">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'green' && 'bg-shamrock-500',
            tone === 'orange' && 'bg-cinnamon-wood-400',
            tone === 'red' && 'bg-red-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  const initial = useMemo(() => defaultRange(7), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [formError, setFormError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportSnapshot | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const generate = useMutation({
    mutationFn: async (params: { from: string; to: string }) => {
      const search = new URLSearchParams({
        period: 'custom',
        from: params.from,
        to: params.to,
      });
      return apiRequest<GenerateResponse>(`/reports/generate?${search.toString()}`, {
        method: 'POST',
      });
    },
    onSuccess: (result) => {
      setReport(result.platform);
      setPdfError(null);
    },
  });

  function handleGenerate() {
    if (!from || !to) {
      setFormError('Select both a start and end date.');
      return;
    }
    if (from > to) {
      setFormError('Start date must be on or before end date.');
      return;
    }
    setFormError(null);
    setPdfError(null);
    generate.mutate({ from, to });
  }

  async function handleDownloadPdf() {
    if (!report) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const { downloadReportPdf } = await import('@/lib/reportExport');
      await downloadReportPdf({ ...report, variant: 'admin' });
    } catch {
      setPdfError('PDF download failed. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  }

  const usage = (report?.metrics.platformUsage as Record<string, number> | undefined) ?? {};
  const mealCount = report ? metricNum(report.metrics, 'mealCount') : 0;
  const approved = report ? metricNum(report.metrics, 'approvedMeals') : 0;
  const inReview = report ? metricNum(report.metrics, 'inReviewMeals') : 0;
  const rejected = report ? metricNum(report.metrics, 'rejectedMeals') : 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Reports" />

      <section className="rounded-2xl border border-ash-grey-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-2xl space-y-1">
          <h2 className="font-sans text-lg font-semibold text-ash-grey-900">Date range</h2>
          <p className="text-sm text-ash-grey-600">
            Pick a start and end date to build one platform report.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <TextField
            label="From"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setFormError(null);
            }}
          />
          <TextField
            label="To"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setFormError(null);
            }}
          />
          <Button
            icon={<CalendarIcon />}
            disabled={generate.isPending}
            onClick={handleGenerate}
            className="w-full lg:w-auto">
            {generate.isPending ? 'Generating…' : 'Generate report'}
          </Button>
        </div>

        {formError ? <p className="mt-3 text-sm font-medium text-red-600">{formError}</p> : null}
        {generate.isError ? (
          <p className="mt-3 text-sm font-medium text-red-600">
            {(generate.error as Error)?.message || 'Failed to generate report.'}
          </p>
        ) : null}
      </section>

      {!report && !generate.isPending ? (
        <section className="rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50/80 px-6 py-14 text-center">
          <p className="font-sans text-lg text-ash-grey-800">No report yet</p>
          <p className="mt-1 text-sm text-ash-grey-500">
            Select dates above and generate to see your MiraFood report here.
          </p>
        </section>
      ) : null}

      {generate.isPending ? (
        <section className="rounded-2xl border border-ash-grey-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm text-ash-grey-500">Building report for your date range…</p>
        </section>
      ) : null}

      {report ? (
        <section className="overflow-hidden rounded-2xl border border-ash-grey-200 bg-white shadow-sm">
          <div className="bg-blue-spruce-600 px-5 py-5 text-white sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-spruce-100">
                  MiraFood · Platform report
                </p>
                <h2 className="mt-1 font-sans text-2xl font-normal tracking-tight">
                  {new Date(report.periodStart).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  –{' '}
                  {new Date(report.periodEnd).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                <p className="mt-1 text-sm text-blue-spruce-100">
                  Generated {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline-light"
                  size="sm"
                  icon={<FilePdfIcon />}
                  disabled={pdfBusy}
                  onClick={() => void handleDownloadPdf()}>
                  {pdfBusy ? 'Preparing…' : 'Download PDF'}
                </Button>
                {pdfError ? <p className="text-xs text-cinnamon-wood-200">{pdfError}</p> : null}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <KpiStrip
              items={[
                { label: 'Meals logged', value: mealCount },
                { label: 'Approved', value: approved },
                {
                  label: 'Approval rate',
                  value: `${metricNum(report.metrics, 'approvalRatePct')}%`,
                },
                {
                  label: 'Active clients',
                  value: usage.uniqueClientsLogging ?? 0,
                },
                { label: 'Coaches', value: metricNum(report.metrics, 'coaches') },
                {
                  label: 'Adherence',
                  value: `${metricNum(report.metrics, 'clientAdherencePct')}%`,
                },
              ]}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50/50 p-4">
                <h3 className="text-sm font-semibold text-ash-grey-900">Meal pipeline</h3>
                <div className="mt-4 space-y-3">
                  <PipelineBar label="Approved" value={approved} total={mealCount} tone="green" />
                  <PipelineBar label="In review" value={inReview} total={mealCount} tone="orange" />
                  <PipelineBar label="Rejected" value={rejected} total={mealCount} tone="red" />
                </div>
              </div>

              <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50/50 p-4">
                <h3 className="text-sm font-semibold text-ash-grey-900">Platform reach</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-600">Patients</dt>
                    <dd className="font-semibold text-ash-grey-900">
                      {metricNum(report.metrics, 'consumers')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-600">Active clients</dt>
                    <dd className="font-semibold text-ash-grey-900">
                      {usage.uniqueClientsLogging ?? 0}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-600">Active share</dt>
                    <dd className="font-semibold text-ash-grey-900">
                      {usage.activeClientSharePct != null ? `${usage.activeClientSharePct}%` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-600">Avg meals / day</dt>
                    <dd className="font-semibold text-ash-grey-900">
                      {String(report.metrics.avgMealsPerDay ?? '—')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-600">Days in range</dt>
                    <dd className="font-semibold text-ash-grey-900">
                      {String(report.metrics.daysInPeriod ?? '—')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
