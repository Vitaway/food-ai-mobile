import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { useCoachPastReviews } from '@/hooks/useCoachQueries';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachPastReviewItem } from '@/types';

const ACTION_FILTERS = [
  { value: 'all', label: 'All reviews' },
  { value: 'approve', label: 'Approved' },
  { value: 'reject', label: 'Rejected' },
] as const;

export function PastReviewsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<'all' | 'approve' | 'reject'>('all');
  const { data: reviews, isLoading } = useCoachPastReviews({
    search: search || undefined,
    action: action === 'all' ? undefined : action,
    limit: 50,
  });

  const summary = useMemo(() => {
    const list = reviews ?? [];
    const approved = list.filter((item) => item.meal.status === 'approved').length;
    const rejected = list.filter((item) => item.meal.status === 'rejected').length;
    return {
      total: list.length,
      approved,
      rejected,
      approvalRate: list.length ? Math.round((approved / list.length) * 100) : 0,
    };
  }, [reviews]);

  const columns: DataTableColumn<CoachPastReviewItem>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (item) => (
        <span className="font-semibold text-ash-grey-900">
          {formatCoachPatientLabel(item.client.patientId, item.client.profile.displayName)}
        </span>
      ),
    },
    {
      key: 'meal',
      header: 'Meal',
      cell: (item) => {
        const coachName = item.review.mealName ?? item.meal.mealName ?? 'Untitled meal';
        return (
          <div>
            <p className="font-medium text-ash-grey-900">{coachName}</p>
            <p className="text-xs text-ash-grey-500">{formatMealType(item.meal.mealType)}</p>
          </div>
        );
      },
    },
    {
      key: 'reviewed',
      header: 'Reviewed',
      cell: (item) => (
        <span className="text-ash-grey-600">
          {item.review.reviewedAt ? formatRelativeTime(item.review.reviewedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      cell: (item) => <StatusBadge status={item.meal.status} />,
    },
    {
      key: 'kcal',
      header: 'Coach kcal',
      cell: (item) => {
        const kcal =
          item.review.totalNutrition?.caloriesKcal ?? item.meal.totalNutrition?.caloriesKcal;
        return kcal != null ? (
          <StatusPill tone="info">{kcal} kcal</StatusPill>
        ) : (
          <span className="text-ash-grey-400">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Review history" />

      <KpiStrip
        columns={4}
        items={[
          { label: 'Shown', value: summary.total, tone: 'info', caption: 'In this view' },
          { label: 'Approved', value: summary.approved, tone: 'success', caption: 'Coach approved' },
          {
            label: 'Rejected',
            value: summary.rejected,
            tone: 'warn',
            warn: summary.rejected > 0,
            caption: 'Returned to client',
          },
          {
            label: 'Approval rate',
            value: `${summary.approvalRate}%`,
            tone: 'accent',
            caption: 'Of loaded results',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search patient ID or meal name…"
          value={search}
          onValueChange={setSearch}
        />
        <Select
          aria-label="Filter by outcome"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={action}
          onChange={(value) => setAction(value as typeof action)}
          options={ACTION_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
        />
      </div>

      <DashboardPanel title="Recent decisions">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading reviews…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={reviews ?? []}
            rowKey={(item) => item.meal.id}
            onRowClick={(item) => navigate(`/coach/history/${item.meal.id}`)}
            emptyTitle="No review history yet"
            emptyDescription="Approved and rejected meals will show up here."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
