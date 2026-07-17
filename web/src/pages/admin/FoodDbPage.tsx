import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, XIcon } from '@/components/icons/ActionIcons';
import { TfctCompositionGrid } from '@/components/nutrition/TfctCompositionGrid';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { StatusPill } from '@/components/ui/StatusPill';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import {
  fetchNutritionCategories,
  fetchNutritionFoodsPage,
  NUTRITION_FOODS_PAGE_SIZE,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import {
  useApproveNutritionFood,
  useRejectNutritionFood,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

type ApprovalFilter = 'all' | 'approved' | 'pending' | 'rejected';
type SourceFilter = '' | 'TFCT' | 'packaged' | 'custom_local';

function statusTone(food: NutritionFood): 'good' | 'warn' | 'bad' | 'muted' {
  if (food.approvalStatus === 'pending') return 'warn';
  if (food.approvalStatus === 'rejected' || !food.isActive) return 'bad';
  return 'good';
}

function statusLabel(food: NutritionFood) {
  if (food.approvalStatus === 'pending') return 'Pending';
  if (food.approvalStatus === 'rejected') return 'Rejected';
  if (!food.isActive) return 'Archived';
  return 'Approved';
}

export function AdminFoodDbPage() {
  const approve = useApproveNutritionFood();
  const reject = useRejectNutritionFood();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [approval, setApproval] = useState<ApprovalFilter>('all');
  const [sourceType, setSourceType] = useState<SourceFilter>('');
  const [page, setPage] = useState(1);
  const [compositionFood, setCompositionFood] = useState<NutritionFood | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'nutrition-db', q, category, approval, sourceType, page],
    queryFn: () =>
      fetchNutritionFoodsPage({
        q: q.trim() || undefined,
        category: category || undefined,
        includeInactive: true,
        approval,
        sourceType: sourceType || undefined,
        page,
        pageSize: NUTRITION_FOODS_PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    setPage(1);
  }, [q, category, approval, sourceType]);

  const foods = data?.items ?? [];
  const total = data?.total ?? 0;

  async function handleApprove(food: NutritionFood) {
    const ok = await confirm({
      title: 'Approve food entry?',
      description: `“${food.name}” will be published to the nutrition database for coaches and the app.`,
      confirmLabel: 'Approve',
    });
    if (!ok) return;
    try {
      await approve.mutateAsync(food.id);
      toast.success('Food entry approved and published.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not approve food'));
    }
  }

  async function handleReject(food: NutritionFood) {
    const ok = await confirm({
      title: 'Reject food entry?',
      description: `“${food.name}” will stay unpublished. The submitter may need to revise and resubmit.`,
      confirmLabel: 'Reject',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await reject.mutateAsync(food.id);
      toast.success('Food entry rejected.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not reject food'));
    }
  }

  const columns: DataTableColumn<NutritionFood>[] = [
    {
      key: 'n',
      header: '#',
      className: 'w-12',
      cell: (_food, index) => (
        <span className="tabular-nums text-xs text-ash-grey-500">
          {(page - 1) * NUTRITION_FOODS_PAGE_SIZE + index + 1}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      cell: (food) => (
        <span className="font-mono text-xs text-ash-grey-600">{food.foodCode ?? '—'}</span>
      ),
    },
    {
      key: 'food',
      header: 'Food',
      cell: (food) => (
        <div className="flex items-center gap-3">
          {food.imageUrl ? (
            <img
              src={resolveMediaUrl(food.imageUrl) ?? ''}
              alt=""
              className="h-11 w-11 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ash-grey-100 text-sm text-ash-grey-400">
              —
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-ash-grey-900">{food.name}</p>
            <p className="truncate text-xs text-ash-grey-500">
              {food.foodGroupName ?? food.category}
              {food.brand ? ` · ${food.brand}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (food) => (
        <StatusPill tone="muted">{food.sourceType ?? 'custom_local'}</StatusPill>
      ),
    },
    {
      key: 'nutrition',
      header: 'Per 100g',
      cell: (food) => (
        <span className="text-ash-grey-700">
          {food.nutritionPer100g.caloriesKcal ?? 0} kcal · P {food.nutritionPer100g.proteinG ?? 0}g
          · C {food.nutritionPer100g.carbsG ?? 0}g · F {food.nutritionPer100g.fatG ?? 0}g
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (food) => <StatusPill tone={statusTone(food)}>{statusLabel(food)}</StatusPill>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (food) => (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => setCompositionFood(food)}>
            Composition
          </Button>
          {food.approvalStatus === 'pending' ? (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<CheckIcon />}
                disabled={approve.isPending}
                onClick={() => void handleApprove(food)}>
                Approve
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<XIcon />}
                disabled={reject.isPending}
                onClick={() => void handleReject(food)}>
                Reject
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Food database" />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, code, barcode…"
          className="min-w-[12rem] flex-1 rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400 sm:max-w-xs"
        />
        <select
          value={approval}
          onChange={(e) => setApproval(e.target.value as ApprovalFilter)}
          className="rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400">
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceFilter)}
          className="rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400">
          <option value="">All sources</option>
          <option value="TFCT">TFCT</option>
          <option value="packaged">Packaged</option>
          <option value="custom_local">Custom / local</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400">
          <option value="">All groups</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <DashboardPanel
        title={total ? `Foods (${total})` : 'Foods'}
        bodyClassName="px-0 py-0 sm:px-0 sm:py-0">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading foods…</p>
        ) : (
          <>
            <div className={isFetching && !isLoading ? 'opacity-60' : undefined}>
              <DataTable
                columns={columns}
                rows={foods}
                rowKey={(f) => f.id}
                emptyTitle="No foods match these filters"
                emptyDescription="Try clearing the search or changing the status / source dropdowns."
              />
            </div>
            <Pagination
              page={page}
              pageSize={NUTRITION_FOODS_PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </DashboardPanel>

      <Modal
        open={Boolean(compositionFood)}
        onClose={() => setCompositionFood(null)}
        title={compositionFood ? compositionFood.name : 'Composition'}
        description={
          compositionFood
            ? [
                compositionFood.foodCode ? `Code ${compositionFood.foodCode}` : null,
                compositionFood.foodGroupName ?? compositionFood.category,
                compositionFood.sourceType ?? null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Per 100g composition'
            : undefined
        }
        size="xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setCompositionFood(null)}>
            Close
          </Button>
        }>
        <TfctCompositionGrid composition={compositionFood?.composition} />
      </Modal>

      {confirmDialog}
    </div>
  );
}
