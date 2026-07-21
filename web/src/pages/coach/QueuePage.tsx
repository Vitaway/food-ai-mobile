import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { StatusPill } from '@/components/ui/StatusPill';
import { StatusBadge, FlagBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  useCoachOperations,
  useCoachQueue,
  usePickMeal,
  useReleaseMealPick,
} from '@/hooks/useCoachQueries';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { useCoachStore } from '@/stores/coachStore';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachQueueItem } from '@/types';

function slaLabel(item: CoachQueueItem): { text: string; tone: 'good' | 'warn' | 'bad' | 'muted' } {
  const meal = item.meal;
  if (meal.queueNeedsPickup) {
    return { text: 'Needs pickup', tone: 'bad' };
  }
  if (!meal.queueIsPicked && meal.waitingMinutes != null && meal.waitingMinutes >= 3) {
    return {
      text: `Unclaimed ${meal.waitingMinutes}m`,
      tone: meal.waitingMinutes >= 5 ? 'bad' : 'warn',
    };
  }
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
  const toast = useToast();
  const filter = useCoachStore((s) => s.filter);
  const setFilter = useCoachStore((s) => s.setFilter);
  const queueSearch = useCoachStore((s) => s.queueSearch);
  const setQueueSearch = useCoachStore((s) => s.setQueueSearch);
  const queueSort = useCoachStore((s) => s.queueSort);
  const setQueueSort = useCoachStore((s) => s.setQueueSort);
  const cohortId = useCoachStore((s) => s.cohortId);

  const { data: coachProfile } = useCoachProfile();
  const pickMutation = usePickMeal();
  const releaseMutation = useReleaseMealPick();

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

  async function handlePick(mealId: string, openAfter = false) {
    try {
      await pickMutation.mutateAsync(mealId);
      toast.success(openAfter ? 'Review claimed — opening meal.' : 'You are working on this review.');
      if (openAfter) navigate(`/coach/queue/${mealId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not claim this review'));
    }
  }

  async function handleRelease(mealId: string) {
    try {
      await releaseMutation.mutateAsync(mealId);
      toast.success('Review released back to the queue.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not release this review'));
    }
  }

  const filters = [
    { id: 'all' as const, label: 'All meals' },
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-ash-grey-900">
            {formatCoachPatientLabel(item.client.patientId ?? item.meal.clientId, item.client.profile.displayName)}
          </span>
          {(item.meal.isProPriority || item.client.membershipTier === 'pro') ? (
            <StatusPill tone="good">Pro</StatusPill>
          ) : null}
          {item.meal.queueNeedsPickup ? <StatusPill tone="bad">Team alert</StatusPill> : null}
        </div>
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
      key: 'pick',
      header: 'Working on',
      cell: (item) => {
        const meal = item.meal;
        const isMine =
          coachProfile?.id && meal.queuePickedByCoachId === coachProfile.id;
        const pickedByOther =
          meal.queueIsPicked && meal.queuePickedByCoachId && !isMine;

        if (pickedByOther) {
          return (
            <span className="text-sm text-ash-grey-600">
              {meal.queuePickedByCoachName ?? 'Another coach'}
            </span>
          );
        }

        if (isMine) {
          return (
            <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <StatusPill tone="good">You</StatusPill>
              <Button
                size="sm"
                variant="outline"
                disabled={releaseMutation.isPending}
                onClick={() => void handleRelease(meal.id)}>
                Release
              </Button>
            </div>
          );
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="primary"
              disabled={pickMutation.isPending}
              onClick={() => void handlePick(meal.id, true)}>
              Pick
            </Button>
          </div>
        );
      },
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
          {
            label: 'Pending review',
            value: ops?.pendingReview ?? queue?.length ?? 0,
            tone: 'accent',
            warn: (ops?.pendingReview ?? queue?.length ?? 0) > 0,
            caption: 'Waiting in queue',
          },
          {
            label: 'Near SLA',
            value: ops?.nearSla ?? 0,
            tone: 'warn',
            warn: (ops?.nearSla ?? 0) > 0,
            caption: 'Breach risk',
          },
          {
            label: 'Correction rate',
            value: ops ? `${ops.correctionRate}%` : '—',
            tone: 'info',
            caption: 'AI edits by coaches',
          },
          {
            label: 'Auto-approval',
            value: ops ? `${ops.autoApprovalRateWeek}%` : '—',
            tone: 'success',
            caption: 'This week',
          },
          {
            label: 'Avg turnaround',
            value: ops ? `${ops.avgTurnaroundHours}h` : '—',
            tone: 'default',
            caption: 'Submit → decision',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search patient ID or meal name…"
          value={queueSearch}
          onValueChange={setQueueSearch}
        />
        <Select
          aria-label="Filter queue"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={filter}
          onChange={(value) => setFilter(value as typeof filter)}
          options={filters.map((f) => ({ value: f.id, label: f.label }))}
        />
        <Select
          aria-label="Sort queue"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={queueSort}
          onChange={(value) => setQueueSort(value as typeof queueSort)}
          options={sortOptions.map((o) => ({ value: o.id, label: o.label }))}
        />
      </div>

      <DashboardPanel title="Meals awaiting review">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(item) => item.meal.id}
            onRowClick={(item) => {
              const meal = item.meal;
              const isMine =
                coachProfile?.id && meal.queuePickedByCoachId === coachProfile.id;
              const blocked =
                meal.queueIsPicked && meal.queuePickedByCoachId && !isMine;
              if (blocked) {
                toast.error(`${meal.queuePickedByCoachName ?? 'Another coach'} is already working on this review.`);
                return;
              }
              navigate(`/coach/queue/${meal.id}`);
            }}
            emptyTitle="Queue is clear"
            emptyDescription="No meals match this filter."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
