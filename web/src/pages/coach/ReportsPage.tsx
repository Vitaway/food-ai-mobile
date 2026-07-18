import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { generateCoachReport, type CoachReportSnapshot } from '@/api/coachApi';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/StatusPill';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { ReportDownloadActions } from '@/components/reports/ReportDownloadActions';
import { getApiErrorMessage } from '@/lib/apiErrors';

type ReportPeriod = 'weekly' | 'monthly' | 'custom';

function metricValue(metrics: Record<string, unknown>, path: string[]): number {
  let current: unknown = metrics;
  for (const key of path) {
    if (!current || typeof current !== 'object') return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'number' ? current : Number(current) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [from, setFrom] = useState(sevenDaysAgo);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<CoachReportSnapshot | null>(null);
  const mutation = useMutation({
    mutationFn: generateCoachReport,
    onSuccess: setReport,
  });

  function runReport() {
    mutation.mutate({
      period,
      from: period === 'custom' ? from : undefined,
      to: period === 'custom' ? to : undefined,
    });
  }

  const activity = report?.metrics ?? {};

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Reports" />

      <DashboardPanel title="Build a coach report">
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ash-grey-800">Report period</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['weekly', 'Last 7 days'],
                  ['monthly', 'Last 30 days'],
                  ['custom', 'Custom dates'],
                ] as const
              ).map(([value, label]) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={period === value}
                  onClick={() => {
                    setPeriod(value);
                    setReport(null);
                  }}
                />
              ))}
            </div>
          </div>

          {period === 'custom' ? (
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-medium text-ash-grey-700">From</span>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setReport(null);
                  }}
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium text-ash-grey-700">To</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={today()}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setReport(null);
                  }}
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
                />
              </label>
            </div>
          ) : (
            <p className="text-sm text-ash-grey-500">
              {period === 'weekly'
                ? 'The report will cover today and the previous 6 days.'
                : 'The report will cover today and the previous 29 days.'}
            </p>
          )}

          {mutation.error ? (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(mutation.error, 'Unable to generate this report')}
            </p>
          ) : null}

          <Button
            onClick={runReport}
            disabled={mutation.isPending || (period === 'custom' && (!from || !to || from > to))}>
            {mutation.isPending ? 'Generating…' : 'Generate report'}
          </Button>
        </div>
      </DashboardPanel>

      {report ? (
        <DashboardPanel
          title={`${report.period === 'custom' ? 'Custom' : report.period} report`}
          action={
            <ReportDownloadActions
              report={{
                ...report,
                variant: 'coach',
              }}
            />
          }>
          <div className="space-y-5 px-3 py-4">
            <div className="px-2">
              <p className="text-sm font-semibold text-ash-grey-800">
                {new Date(`${report.periodStart}T00:00:00`).toLocaleDateString()} –{' '}
                {new Date(`${report.periodEnd}T00:00:00`).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-ash-grey-500">
                Generated {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
            <KpiStrip
              items={[
                {
                  label: 'Reviews completed',
                  value: metricValue(activity, ['coachActivity', 'reviewsCompleted']),
                },
                {
                  label: 'Meals approved',
                  value: metricValue(activity, ['coachActivity', 'mealsApproved']),
                },
                {
                  label: 'Meals rejected',
                  value: metricValue(activity, ['coachActivity', 'mealsRejected']),
                },
                {
                  label: 'Patients reviewed',
                  value: metricValue(activity, ['coachActivity', 'uniquePatientsReviewed']),
                },
                {
                  label: 'Caseload in queue',
                  value: metricValue(activity, ['coachActivity', 'mealsInQueue']),
                },
                {
                  label: 'Avg review time',
                  value: `${metricValue(activity, ['coachActivity', 'averageReviewMinutes'])} min`,
                },
              ]}
            />
          </div>
        </DashboardPanel>
      ) : (
        <div className="rounded-2xl border border-dashed border-ash-grey-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-ash-grey-800">Select a period and generate your report</p>
          <p className="mt-1 text-sm text-ash-grey-500">
            Only the report you request will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
