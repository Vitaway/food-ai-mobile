import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { FilterChip, StatusPill } from '@/components/ui/StatusPill';
import { StatusBadge, FlagBadge } from '@/components/ui/Badge';
import { useCoachOperations, useCoachQueue } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachQueueItem } from '@/types';

function slaLabel(item: CoachQueueItem): { text: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
  const meal = item.meal;
  if (meal.slaMinutesRemaining != null && meal.slaMinutesRemaining <= 0) {
    return { text: 'SLA breached', tone: 'bad' };
  }
  if (meal.slaMinutesRemaining != null && meal.slaMinutesRemaining <= 120) {
    return {
      text: `${meal.slaMinutesRemaining}m to SLA`,
      tone: meal.slaLevel === 'critical' ? 'bad' : 'warn',
    };
  }
  if (meal.waitingMinutes != null && meal.waitingMinutes >= 60) {
    return {
      text: `Waiting ${meal.waitingMinutes}m`,
      tone: meal.slaLevel === 'critical' ? 'bad' : 'warn',
    };
  }
  return { text: 'On track', tone: 'good' };
}

export function QueuePage() {
  const navigate = useNavigate();
  const filter = useCoachStore((s) => s.filter);
  const setFilter = useCoachStore((s) => s.setFilter);
  const queueSearch = useCoachStore((s) => s.queueSearch);
  const setQueueSearch = useCoachStore((s) => s.setQueueSearch);
  const queueSort = useCoachStore((s) => s.queueSort);
  const setQueueSort = useCoachStore((s) => s.setQueueSort);
  const cohortId = useCoachStore((s) => s.cohortId);

  const { data: queue, isLoading } = useCoachQueue({
    search: queueSearch || undefined,
    sort: queueSort,
    cohortId: cohortId ?? undefined,
  });
  const { data: ops } = useCoachOperations();

  const filtered = useMemo(() => {
    return (queue ?? []).filter((item) => {
      if (filter === 'flagged') return item.meal.fraudCheckResult === 'flag';
      if (filter === 'low_confidence') return (item.meal.confidenceAvg ?? 1) < 0.8;
      return true;
    });
  }, [queue, filter]);

  const filters = [
    { id: 'all' as const, label: 'All' },
    { id: 'flagged' as const, label: 'Flagged' },
    { id: 'low_confidence' as const, label: 'Low confidence' },
  ];

  const sortOptions = [
    { id: 'sla_urgency' as const, label: 'SLA urgency' },
    { id: 'oldest' as const, label: 'Oldest first' },
    { id: 'newest' as const, label: 'Newest first' },
    { id: 'flagged' as const, label: 'Flagged first' },
    { id: 'low_confidence' as const, label: 'Low confidence' },
  ];

  const columns: DataTableColumn<CoachQueueItem>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (item) => (
        <span className="font-semibold text-ash-grey-900">
          {formatCoachPatientLabel(item.client.patientId ?? item.meal.clientId, item.client.profile.displayName)}
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
      key: 'confidence',
      header: 'Confidence',
      cell: (item) => {
        const pct = item.meal.confidenceAvg != null ? Math.round(item.meal.confidenceAvg * 100) : null;
        const low = pct != null && pct < 80;
        return pct == null ? (
          <span className="text-ash-grey-400">—</span>
        ) : (
          <StatusPill tone={low ? 'warn' : 'good'}>{pct}%</StatusPill>
        );
      },
    },
    {
      key: 'sla',
      header: 'SLA',
      cell: (item) => {
        const sla = slaLabel(item);
        return <StatusPill tone={sla.tone}>{sla.text}</StatusPill>;
      },
    },
    {
      key: 'flags',
      header: 'Flags',
      cell: (item) => {
        const allergies =
          item.meal.hasAllergies || (item.client.profile.allergies?.length ?? 0) > 0;
        return (
          <div className="flex flex-wrap gap-1">
            <StatusBadge status={item.meal.status} />
            <FlagBadge flagged={item.meal.fraudCheckResult === 'flag'} />
            {item.meal.complexity ? (
              <StatusPill tone={item.meal.complexity === 'high' ? 'bad' : 'warn'}>
                {item.meal.complexity}
              </StatusPill>
            ) : null}
            {allergies ? <StatusPill tone="bad">Allergies</StatusPill> : null}
            {item.meal.manualReviewRequired ? (
              <StatusPill tone="warn">
                {item.meal.manualReviewReason === 'ai_unavailable' ? 'AI unavailable' : 'Manual'}
              </StatusPill>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Review queue" actions={<CohortFilter />} />

      <KpiStrip
        items={[
          { label: 'Pending review', value: ops?.pendingReview ?? queue?.length ?? 0 },
          { label: 'Near SLA', value: ops?.nearSla ?? 0, warn: (ops?.nearSla ?? 0) > 0 },
          { label: 'Correction rate', value: ops ? `${ops.correctionRate}%` : '—' },
          { label: 'Auto-approval (week)', value: ops ? `${ops.autoApprovalRateWeek}%` : '—' },
          { label: 'Avg turnaround', value: ops ? `${ops.avgTurnaroundHours}h` : '—' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search patient ID or meal name…"
          className="flex-1 rounded-xl border border-ash-grey-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={queueSearch}
          onChange={(e) => setQueueSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-ash-grey-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={queueSort}
          onChange={(e) => setQueueSort(e.target.value as typeof queueSort)}>
          {sortOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>

      <DashboardPanel title="Meals awaiting review">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(item) => item.meal.id}
            onRowClick={(item) => navigate(`/coach/queue/${item.meal.id}`)}
            emptyTitle="Queue is clear"
            emptyDescription="No meals match this filter."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
