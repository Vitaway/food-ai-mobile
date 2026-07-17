import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { FilterChip, StatusPill } from '@/components/ui/StatusPill';
import { useCoachPastReviews } from '@/hooks/useCoachQueries';
import {
  formatCoachPatientLabel,
  formatMealType,
  formatRelativeTime,
} from '@/lib/utils';
import type { CoachPastReviewItem } from '@/types';

export function PastReviewsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<'all' | 'approve' | 'reject'>('all');
  const { data: reviews, isLoading } = useCoachPastReviews({
    search: search || undefined,
    action: action === 'all' ? undefined : action,
    limit: 50,
  });

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search patient ID or meal name…"
          className="flex-1 rounded-xl border border-ash-grey-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all' as const, label: 'All reviews' },
            { id: 'approve' as const, label: 'Approved' },
            { id: 'reject' as const, label: 'Rejected' },
          ] as const
        ).map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={action === f.id}
            onClick={() => setAction(f.id)}
          />
        ))}
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
