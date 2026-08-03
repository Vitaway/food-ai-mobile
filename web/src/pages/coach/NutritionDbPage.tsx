import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { ArchiveIcon, PencilIcon, PlusIcon, RefreshIcon } from '@/components/icons/ActionIcons';
import { TfctCompositionGrid } from '@/components/nutrition/TfctCompositionGrid';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { cn } from '@/lib/utils';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { RecipeBuilderPanel } from '@/components/nutrition/RecipeBuilderPanel';
import { NutritionFoodEditorModal } from '@/components/nutrition/NutritionFoodEditorModal';
import { Tabs } from '@/components/ui/Tabs';
import {
  fetchNutritionCategories,
  fetchNutritionFoodsPage,
  lookupNutritionBarcode,
  NUTRITION_FOODS_PAGE_SIZE,
  updateNutritionFood,
  uploadNutritionFoodImage,
  type NutritionFood,
} from '@/api/nutritionDbApi';

function FoodPhotoThumb({
  imageUrl,
  name,
  size = 'md',
  onClick,
}: {
  imageUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const src = resolveMediaUrl(imageUrl);
  const sizeClass =
    size === 'lg' ? 'h-20 w-20 rounded-2xl' : size === 'md' ? 'h-14 w-14 rounded-xl' : 'h-11 w-11 rounded-lg';

  const content = src ? (
    <img src={src} alt={name} className={cn(sizeClass, 'object-cover')} />
  ) : (
    <div
      className={cn(
        sizeClass,
        'flex items-center justify-center border border-dashed border-ash-grey-300 bg-ash-grey-50 text-ash-grey-400',
      )}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
        <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
      </svg>
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      title={src ? 'Change photo' : 'Upload photo'}
      className="group relative shrink-0 overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-spruce-300">
      {content}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        {src ? 'Change' : 'Upload'}
      </span>
    </button>
  );
}


function StatusBadge({ food }: { food: NutritionFood }) {
  const label = food.displayStatus ?? (food.approvalStatus === 'pending' ? 'Pending' : !food.isActive ? 'Archived' : 'Verified');
  const cls =
    label === 'Pending'
      ? 'bg-cinnamon-wood-100 text-cinnamon-wood-700'
      : label === 'Verified'
        ? 'bg-shamrock-50 text-shamrock-700'
        : label === 'Draft'
          ? 'bg-ash-grey-100 text-ash-grey-600'
          : 'bg-ash-grey-100 text-ash-grey-600';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
  );
}

export function NutritionDbPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const rowPhotoRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q.trim());
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [barcodeLookup, setBarcodeLookup] = useState('');
  const [editing, setEditing] = useState<NutritionFood | null>(null);
  const [compositionFood, setCompositionFood] = useState<NutritionFood | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'foods' | 'recipes'>('foods');

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['coach', 'nutrition-db', deferredQ, category, page],
    queryFn: () =>
      fetchNutritionFoodsPage({
        q: deferredQ || undefined,
        category,
        includeInactive: true,
        page,
        pageSize: NUTRITION_FOODS_PAGE_SIZE,
        excludeSourceTypes: ['recipe'],
      }),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    setPage(1);
  }, [deferredQ, category]);

  const archiveMutation = useMutation({
    mutationFn: (food: NutritionFood) => updateNutritionFood(food.id, { isActive: !food.isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] }),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not update food')),
  });

  async function handleArchive(food: NutritionFood) {
    const archiving = food.isActive;
    const ok = await confirm({
      title: archiving ? 'Archive this food?' : 'Restore this food?',
      description: archiving
        ? `“${food.name}” will be hidden from active lookups until restored.`
        : `“${food.name}” will be available in the nutrition database again.`,
      confirmLabel: archiving ? 'Archive' : 'Restore',
      tone: archiving ? 'danger' : 'primary',
    });
    if (!ok) return;
    archiveMutation.mutate(food);
  }

  const imageMutation = useMutation({
    mutationFn: ({ foodId, file }: { foodId: string; file: File }) => uploadNutritionFoodImage(foodId, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] });
      toast.success('Reference photo updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not upload photo')),
  });

  const barcodeMutation = useMutation({
    mutationFn: (code: string) => lookupNutritionBarcode(code),
    onSuccess: (food) => {
      if (!food) {
        setLookupMessage('No food found for that barcode.');
        return;
      }
      setLookupMessage(`Found: ${food.name}`);
      openEditModal(food);
    },
  });

  const foods = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? page;
  const pageSize = data?.pageSize ?? NUTRITION_FOODS_PAGE_SIZE;
  const foodStats = {
    total,
    approved: foods.filter((f) => f.approvalStatus === 'approved').length,
    pending: foods.filter((f) => f.approvalStatus === 'pending').length,
    rejected: foods.filter((f) => f.approvalStatus === 'rejected').length,
    withPhoto: foods.filter((f) => Boolean(f.imageUrl)).length,
  };

  useEffect(() => {
    if (!data) return;
    if (page > data.totalPages && data.totalPages > 0) {
      setPage(data.totalPages);
    }
  }, [data, page]);

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function openAddModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(food: NutritionFood) {
    setEditing(food);
    setModalOpen(true);
  }

  function uploadRowPhoto(foodId: string, file: File) {
    imageMutation.mutate({ foodId, file });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Nutrition database"
        actions={
          tab === 'foods' ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={openAddModal}>
              Add food
            </Button>
          ) : null
        }
      />

      <Tabs
        tabs={[
          { id: 'foods', label: 'Foods' },
          { id: 'recipes', label: 'Recipes' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as 'foods' | 'recipes')}
        variant="segmented"
      />

      {tab === 'recipes' ? <RecipeBuilderPanel /> : null}

      {tab === 'foods' ? (
        <>
      <KpiStrip
        columns={5}
        items={[
          { label: 'Foods', value: foodStats.total, tone: 'info', caption: 'Matching filters' },
          {
            label: 'Approved',
            value: foodStats.approved,
            tone: 'success',
            caption: 'On this page',
          },
          {
            label: 'Pending',
            value: foodStats.pending,
            tone: 'accent',
            warn: foodStats.pending > 0,
            caption: 'Awaiting approval',
          },
          {
            label: 'Rejected',
            value: foodStats.rejected,
            tone: 'warn',
            warn: foodStats.rejected > 0,
            caption: 'Needs rework',
          },
          {
            label: 'With photo',
            value: foodStats.withPhoto,
            tone: 'default',
            caption: 'On this page',
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="min-w-[12rem] flex-1 sm:max-w-xs"
          value={q}
          onValueChange={setQ}
          placeholder="Search foods by name, brand, or local name…"
          size="sm"
        />
        <Select
          aria-label="Filter by category"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={category}
          onChange={setCategory}
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((item) => ({ value: item, label: item })),
          ]}
        />
        <input
          value={barcodeLookup}
          onChange={(e) => setBarcodeLookup(e.target.value)}
          placeholder="Lookup barcode"
          className="rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
        />
        <Button
          variant="outline"
          onClick={() => barcodeMutation.mutate(barcodeLookup)}
          disabled={!barcodeLookup.trim() || barcodeMutation.isPending}>
          {barcodeMutation.isPending ? 'Looking up…' : 'Lookup'}
        </Button>
      </div>

      {lookupMessage ? (
        <p className="rounded-xl bg-blue-spruce-50 px-4 py-2 text-sm text-blue-spruce-800">{lookupMessage}</p>
      ) : null}

      <DashboardPanel
        title={data?.total != null ? `Foods (${data.total})` : 'Foods'}
        bodyClassName="px-0 py-0 sm:px-0 sm:py-0">
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-ash-grey-500">Loading foods…</p>
        ) : foods.length ? (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-100 bg-ash-grey-50/80 text-[11px] uppercase tracking-wide text-ash-grey-500">
                  <th className="px-5 py-3.5 font-semibold">Photo</th>
                  <th className="px-5 py-3.5 font-semibold">Code</th>
                  <th className="px-5 py-3.5 font-semibold">Food</th>
                  <th className="px-5 py-3.5 font-semibold">Group</th>
                  <th className="px-5 py-3.5 font-semibold">Source</th>
                  <th className="px-5 py-3.5 font-semibold">Per 100g</th>
                  <th className="px-5 py-3.5 font-semibold">Fields</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className={cn(isFetching && !isLoading && 'opacity-60')}>
                {foods.map((food) => {
                  const n = food.nutritionPer100g;
                  return (
                    <tr
                      key={food.id}
                      className={cn(
                        'border-b border-ash-grey-50 transition-colors last:border-0 hover:bg-ash-grey-50/60',
                        !food.isActive && 'opacity-60',
                      )}>
                      <td className="px-5 py-4">
                        <FoodPhotoThumb
                          imageUrl={food.imageUrl}
                          name={food.name}
                          size="md"
                          onClick={() => rowPhotoRefs.current[food.id]?.click()}
                        />
                        <input
                          ref={(el) => {
                            rowPhotoRefs.current[food.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadRowPhoto(food.id, file);
                            e.target.value = '';
                          }}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-ash-grey-600">
                        {food.foodCode ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-ash-grey-900">{food.name}</p>
                          {food.brand ? (
                            <p className="truncate text-xs text-ash-grey-500">{food.brand}</p>
                          ) : null}
                          {food.barcode ? (
                            <p className="truncate font-mono text-[11px] text-ash-grey-400">
                              {food.barcode}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ash-grey-700">
                        <p>{food.foodGroupName ?? food.category}</p>
                        {food.foodGroup ? (
                          <p className="text-[11px] text-ash-grey-400">{food.foodGroup}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-ash-grey-100 px-2 py-0.5 text-xs text-ash-grey-700">
                          {food.sourceType ?? 'custom_local'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-ash-grey-100 px-2 py-0.5 text-xs font-medium">
                            {n.caloriesKcal ?? 0} kcal
                          </span>
                          <span className="rounded-md bg-shamrock-50 px-2 py-0.5 text-xs text-shamrock-800">
                            P {n.proteinG ?? 0}g
                          </span>
                          <span className="rounded-md bg-blue-spruce-50 px-2 py-0.5 text-xs text-blue-spruce-800">
                            C {n.carbsG ?? 0}g
                          </span>
                          <span className="rounded-md bg-cinnamon-wood-50 px-2 py-0.5 text-xs text-cinnamon-wood-800">
                            F {n.fatG ?? 0}g
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-ash-grey-600">
                          {food.fieldCompleteness?.filled ?? 0}/{food.fieldCompleteness?.total ?? 15}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge food={food} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCompositionFood(food)}>
                            Composition
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<PencilIcon />}
                            onClick={() => openEditModal(food)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={food.isActive ? <ArchiveIcon /> : <RefreshIcon />}
                            onClick={() => void handleArchive(food)}>
                            {food.isActive ? 'Archive' : 'Restore'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-ash-grey-800">No foods found</p>
            <p className="mt-1 text-sm text-ash-grey-500">Try a different search or add a new food entry.</p>
            <Button variant="primary" size="sm" className="mt-4" icon={<PlusIcon />} onClick={openAddModal}>
              Add food
            </Button>
          </div>
        )}
      </DashboardPanel>

      <NutritionFoodEditorModal
        open={modalOpen}
        editing={editing}
        mode="coach"
        onClose={closeModal}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] });
          void qc.invalidateQueries({ queryKey: ['nutrition-db', 'picker'] });
        }}
      />

      <Modal
        open={Boolean(compositionFood)}
        onClose={() => setCompositionFood(null)}
        title={compositionFood ? compositionFood.name : 'Composition'}
        description={
          compositionFood
            ? [
                compositionFood.foodCode ? `Code ${compositionFood.foodCode}` : null,
                compositionFood.foodGroupName ?? compositionFood.category,
                compositionFood.sourceVersion ?? compositionFood.source ?? null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Per 100g TFCT composition'
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
        </>
      ) : null}

      {confirmDialog}
    </div>
  );
}
