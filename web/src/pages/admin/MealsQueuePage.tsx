import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { FilterChip, StatusPill } from '@/components/ui/StatusPill';
import { MealImage } from '@/components/coach/MealImage';
import { StatusBadge } from '@/components/ui/Badge';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import {
  useAdminReviewQueue,
  useAdminForceReleaseMealPick,
  useAdminCoaches,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatRelativeTime } from '@/lib/utils';
import type { AdminQueueMeal, AdminQueueStatusFilter } from '@/features/admin/api/adminApi';

const STATUS_FILTERS: { id: AdminQueueStatusFilter; label: string }[] = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_review', label: 'In review' },
  { id: 'previous', label: 'Previous' },
];

export function AdminMealsQueuePage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<AdminQueueStatusFilter>('waiting');
  const { data, isLoading } = useAdminReviewQueue(statusFilter);
  const { data: coaches = [] } = useAdminCoaches();
  const releaseMutation = useAdminForceReleaseMealPick();

  const queue = data?.items ?? [];
  const counts = data?.counts ?? { waiting: 0, in_review: 0, previous: 0 };

  const coachNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const coach of coaches) {
      map.set(coach.id, coach.displayName);
    }
    return map;
  }, [coaches]);

  async function handleRelease(mealId: string, coachName?: string | null) {
    try {
      await releaseMutation.mutateAsync(mealId);
      toast.success(
        coachName
          ? `Released pick from ${coachName}. Another coach can claim it.`
          : 'Pick released. Another coach can claim it.',
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not release this review'));
    }
  }

  const panelTitle =
    statusFilter === 'waiting'
      ? `Waiting · ${counts.waiting}`
      : statusFilter === 'previous'
        ? `Previous · ${counts.previous}`
        : `In review · ${counts.in_review}`;

  const columns: DataTableColumn<AdminQueueMeal>[] = [
    {
      key: 'meal',
      header: 'Meal',
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <MealImage
            variant="thumb"
            imageUrl={row.imageUrl}
            alt={row.mealName}
            className="h-12 w-12 shrink-0 rounded-xl"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ash-grey-900">{row.mealName}</p>
            <p className="truncate text-xs capitalize text-ash-grey-500">
              {row.mealType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      cell: (row) =>
        row.userId ? (
          <Link
            to={ADMIN_ROUTES.userDetail(row.userId)}
            className="font-medium text-blue-spruce-700 hover:underline">
            {row.clientName ?? row.patientId}
          </Link>
        ) : (
          <span className="text-ash-grey-700">{row.clientName ?? row.patientId}</span>
        ),
    },
    {
      key: 'assigned',
      header: 'Assigned coaches',
      cell: (row) => {
        if (!row.assignedCoachIds.length) {
          return <span className="text-ash-grey-400">Unassigned</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.assignedCoachIds.map((id) => (
              <StatusPill key={id} tone="muted">
                {coachNameById.get(id) ?? id.slice(0, 8)}
              </StatusPill>
            ))}
          </div>
        );
      },
    },
    ...(statusFilter === 'previous'
      ? ([
          {
            key: 'outcome',
            header: 'Outcome',
            cell: (row: AdminQueueMeal) => (
              <StatusBadge status={row.status as 'approved' | 'rejected' | 'in_review'} />
            ),
          },
          {
            key: 'reviewed',
            header: 'Reviewed',
            cell: (row: AdminQueueMeal) => (
              <div className="space-y-0.5">
                <p className="text-sm text-ash-grey-700">
                  {row.reviewedAt ? formatRelativeTime(row.reviewedAt) : '—'}
                </p>
                {row.reviewedByCoachId ? (
                  <p className="text-xs text-ash-grey-500">
                    {coachNameById.get(row.reviewedByCoachId) ?? row.reviewedByCoachId.slice(0, 8)}
                  </p>
                ) : null}
              </div>
            ),
          },
        ] as DataTableColumn<AdminQueueMeal>[])
      : ([
          {
            key: 'pick',
            header: 'Working on',
            cell: (row: AdminQueueMeal) => {
              if (row.queueNeedsPickup) {
                return <StatusPill tone="bad">Needs pickup</StatusPill>;
              }
              if (row.queueIsPicked) {
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ash-grey-800">
                      {row.queuePickedByCoachName ?? 'Coach'}
                    </p>
                    {row.queuePickedAt ? (
                      <p className="text-xs text-ash-grey-500">
                        Picked {formatRelativeTime(row.queuePickedAt)}
                      </p>
                    ) : null}
                  </div>
                );
              }
              return <StatusPill tone="warn">Unclaimed</StatusPill>;
            },
          },
          {
            key: 'wait',
            header: 'Waiting',
            cell: (row: AdminQueueMeal) => (
              <span className="text-ash-grey-700">{row.waitingMinutes}m</span>
            ),
          },
        ] as DataTableColumn<AdminQueueMeal>[])),
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => (
        <span className="text-ash-grey-600">{formatRelativeTime(row.submittedAt)}</span>
      ),
    },
    ...(statusFilter === 'previous'
      ? []
      : ([
          {
            key: 'actions',
            header: '',
            cell: (row: AdminQueueMeal) =>
              row.queueIsPicked ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={releaseMutation.isPending}
                  onClick={() => void handleRelease(row.mealId, row.queuePickedByCoachName)}>
                  Release pick
                </Button>
              ) : (
                <span className="text-xs text-ash-grey-400">—</span>
              ),
          },
        ] as DataTableColumn<AdminQueueMeal>[])),
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Review queue" />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <FilterChip
            key={item.id}
            label={`${item.label} · ${counts[item.id]}`}
            active={statusFilter === item.id}
            onClick={() => setStatusFilter(item.id)}
          />
        ))}
      </div>

      <DashboardPanel title={panelTitle}>
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading queue…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={queue}
            rowKey={(row) => row.mealId}
            emptyTitle={
              statusFilter === 'waiting'
                ? 'Nothing waiting'
                : statusFilter === 'previous'
                  ? 'No previous reviews'
                  : 'No active reviews'
            }
            emptyDescription={
              statusFilter === 'waiting'
                ? 'Unclaimed meals waiting for a coach will show up here.'
                : statusFilter === 'previous'
                  ? 'Approved and rejected meals appear here.'
                  : 'Meals currently being worked on by a coach will show up here.'
            }
          />
        )}
      </DashboardPanel>
    </div>
  );
}
