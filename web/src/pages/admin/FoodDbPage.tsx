import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, PlusIcon, XIcon } from '@/components/icons/ActionIcons';
import { NutritionFoodEditorModal } from '@/components/nutrition/NutritionFoodEditorModal';
import { TfctCompositionGrid } from '@/components/nutrition/TfctCompositionGrid';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { servingUnitLabel } from '@/lib/servingUnits';
import {
  fetchNutritionCategories,
  fetchNutritionFoodsPage,
  NUTRITION_FOODS_PAGE_SIZE,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import {
  fetchNutritionRecipes,
  type NutritionRecipe,
} from '@/api/nutritionRecipeApi';
import {
  useApproveNutritionFood,
  useRejectNutritionFood,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

type ApprovalFilter = 'all' | 'approved' | 'pending' | 'rejected';
type SourceFilter = '' | 'TFCT' | 'packaged' | 'custom_local';
type AdminDbTab = 'foods' | 'recipes';

function statusTone(food: NutritionFood): 'good' | 'warn' | 'bad' | 'muted' {
  if (food.approvalStatus === 'pending') return 'warn';
  if (food.approvalStatus === 'draft') return 'muted';
  if (food.approvalStatus === 'rejected' || !food.isActive) return 'bad';
  return 'good';
}

function statusLabel(food: NutritionFood) {
  return food.displayStatus ?? (
    food.approvalStatus === 'pending'
      ? 'Pending'
      : food.approvalStatus === 'draft'
        ? 'Draft'
        : food.approvalStatus === 'rejected'
          ? 'Rejected'
          : !food.isActive
            ? 'Archived'
            : 'Verified'
  );
}

export function AdminFoodDbPage() {
  const qc = useQueryClient();
  const approve = useApproveNutritionFood();
  const reject = useRejectNutritionFood();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [tab, setTab] = useState<AdminDbTab>('foods');
  const [q, setQ] = useState('');
  const [recipeQ, setRecipeQ] = useState('');
  const [category, setCategory] = useState('');
  const [approval, setApproval] = useState<ApprovalFilter>('all');
  const [sourceType, setSourceType] = useState<SourceFilter>('');
  const [page, setPage] = useState(1);
  const [compositionFood, setCompositionFood] = useState<NutritionFood | null>(null);
  const [compositionRecipe, setCompositionRecipe] = useState<NutritionRecipe | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<NutritionFood | null>(null);

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
        excludeSourceTypes: ['recipe'],
        page,
        pageSize: NUTRITION_FOODS_PAGE_SIZE,
      }),
    enabled: tab === 'foods',
    placeholderData: (previous) => previous,
  });

  const recipesQuery = useQuery({
    queryKey: ['admin', 'nutrition-recipes', recipeQ],
    queryFn: () => fetchNutritionRecipes(recipeQ.trim() || undefined),
    enabled: tab === 'recipes',
  });

  useEffect(() => {
    setPage(1);
  }, [q, category, approval, sourceType]);

  const foods = data?.items ?? [];
  const total = data?.total ?? 0;
  const recipes = recipesQuery.data ?? [];

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

  const columns: DataTableColumn<NutritionFood>[] = useMemo(
    () => [
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
            {food.nutritionPer100g.caloriesKcal ?? 0} kcal · P {food.nutritionPer100g.proteinG ?? 0}
            g · C {food.nutritionPer100g.carbsG ?? 0}g · F {food.nutritionPer100g.fatG ?? 0}g
          </span>
        ),
      },
      {
        key: 'fields',
        header: 'Fields',
        cell: (food) => {
          const filled = food.fieldCompleteness?.filled ?? 0;
          const total = food.fieldCompleteness?.total ?? 15;
          return (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(total, 15) }, (_, i) => (
                  <i
                    key={i}
                    className={`block h-1.5 w-1.5 rounded-full ${i < filled ? 'bg-emerald-500' : 'bg-ash-grey-200'}`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs text-ash-grey-500">
                {filled}/{total}
              </span>
            </div>
          );
        },
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingFood(food);
                setEditorOpen(true);
              }}>
              Edit
            </Button>
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest confirm/approve
    [page, approve.isPending, reject.isPending],
  );

  const recipeColumns: DataTableColumn<NutritionRecipe>[] = [
    {
      key: 'recipe',
      header: 'Recipe',
      cell: (recipe) => (
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ash-grey-900">
            {recipe.name}
            <StatusPill tone="info">Recipe</StatusPill>
          </p>
          <p className="truncate text-xs text-ash-grey-500">
            {recipe.nameRw || '—'}
            {' · '}
            {recipe.ingredientCount ?? recipe.ingredients.length} ingredients
          </p>
        </div>
      ),
    },
    {
      key: 'yield',
      header: 'Yield',
      cell: (recipe) => (
        <span className="tabular-nums text-ash-grey-700">
          {recipe.cookedYieldG != null ? `${recipe.cookedYieldG} g` : '—'}
        </span>
      ),
    },
    {
      key: 'serving',
      header: 'Serving',
      cell: (recipe) => {
        const serving =
          recipe.defaultServing ??
          recipe.servings.find((s) => s.isDefault) ??
          recipe.servings[0];
        return (
          <span className="text-ash-grey-600">
            {serving
              ? `1 ${servingUnitLabel(serving.unit)} = ${serving.gramsEquivalent} g`
              : '—'}
          </span>
        );
      },
    },
    {
      key: 'kcal',
      header: 'kcal / serving',
      cell: (recipe) => (
        <span className="tabular-nums text-ash-grey-700">
          {recipe.kcalPerServing != null ? Math.round(recipe.kcalPerServing) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (recipe) => <StatusPill tone={statusTone(recipe)}>{statusLabel(recipe)}</StatusPill>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (recipe) => (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => setCompositionRecipe(recipe)}>
            Composition
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Food database"
        actions={
          tab === 'foods' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon />}
              onClick={() => {
                setEditingFood(null);
                setEditorOpen(true);
              }}>
              Add food
            </Button>
          ) : null
        }
      />

      <Tabs
        tabs={[
          { id: 'foods', label: 'Foods', count: tab === 'foods' ? total : undefined },
          {
            id: 'recipes',
            label: 'Recipes',
            count: tab === 'recipes' ? recipes.length : undefined,
          },
        ]}
        active={tab}
        onChange={(id) => setTab(id as AdminDbTab)}
      />

      {tab === 'foods' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              className="min-w-[12rem] flex-1 sm:max-w-xs"
              value={q}
              onValueChange={setQ}
              placeholder="Search name, code, barcode…"
              size="sm"
            />
            <Select
              aria-label="Filter by approval status"
              variant="filter"
              size="sm"
              className="w-full sm:w-40"
              value={approval}
              onChange={(value) => setApproval(value as ApprovalFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <Select
              aria-label="Filter by source"
              variant="filter"
              size="sm"
              className="w-full sm:w-40"
              value={sourceType}
              onChange={(value) => setSourceType(value as SourceFilter)}
              options={[
                { value: '', label: 'All sources' },
                { value: 'TFCT', label: 'TFCT' },
                { value: 'packaged', label: 'Packaged' },
                { value: 'custom_local', label: 'Custom / local' },
              ]}
            />
            <Select
              aria-label="Filter by food group"
              variant="filter"
              size="sm"
              className="w-full sm:w-44"
              value={category}
              onChange={setCategory}
              options={[
                { value: '', label: 'All groups' },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />
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
                    emptyDescription="Try clearing the search, or add a new food with Add food."
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
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              className="min-w-[12rem] flex-1 sm:max-w-xs"
              value={recipeQ}
              onValueChange={setRecipeQ}
              placeholder="Search recipes (EN / Kinyarwanda)…"
              size="sm"
            />
            <p className="text-xs text-ash-grey-500">
              Recipes are authored on the coach Nutrition DB. Admins can review composition here.
            </p>
          </div>

          <DashboardPanel
            title={recipes.length ? `Recipes (${recipes.length})` : 'Recipes'}
            bodyClassName="px-0 py-0 sm:px-0 sm:py-0">
            {recipesQuery.isLoading ? (
              <p className="px-3 py-8 text-sm text-ash-grey-500">Loading recipes…</p>
            ) : recipesQuery.isError ? (
              <p className="px-3 py-8 text-sm text-red-600">
                {getApiErrorMessage(recipesQuery.error, 'Could not load recipes')}
              </p>
            ) : (
              <DataTable
                columns={recipeColumns}
                rows={recipes}
                rowKey={(r) => r.id}
                emptyTitle="No recipes yet"
                emptyDescription="Coaches create dishes under Nutrition DB → Recipes. Once saved, they show up here."
              />
            )}
          </DashboardPanel>
        </>
      )}

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

      <Modal
        open={Boolean(compositionRecipe)}
        onClose={() => setCompositionRecipe(null)}
        title={compositionRecipe ? compositionRecipe.name : 'Recipe composition'}
        description={
          compositionRecipe
            ? [
                compositionRecipe.nameRw,
                compositionRecipe.cookedYieldG != null
                  ? `Yield ${compositionRecipe.cookedYieldG} g`
                  : null,
                `${compositionRecipe.ingredientCount ?? compositionRecipe.ingredients.length} ingredients`,
              ]
                .filter(Boolean)
                .join(' · ') || 'Per 100g cooked'
            : undefined
        }
        size="xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setCompositionRecipe(null)}>
            Close
          </Button>
        }>
        <div className="space-y-4">
          {compositionRecipe?.ingredients?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Ingredients
              </p>
              <ul className="space-y-1 text-sm text-ash-grey-700">
                {compositionRecipe.ingredients.map((ing) => (
                  <li key={ing.id ?? ing.ingredientFoodId}>
                    {ing.name}
                    {ing.nameRw ? ` (${ing.nameRw})` : ''}; {ing.rawWeightG} g raw
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Per 100 g cooked
            </p>
            <TfctCompositionGrid composition={compositionRecipe?.composition} />
          </div>
          {compositionRecipe?.perServing ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Per default serving
              </p>
              <TfctCompositionGrid composition={compositionRecipe.perServing} />
            </div>
          ) : null}
        </div>
      </Modal>

      <NutritionFoodEditorModal
        open={editorOpen}
        editing={editingFood}
        onClose={() => {
          setEditorOpen(false);
          setEditingFood(null);
        }}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ['admin', 'nutrition-db'] });
          void qc.invalidateQueries({ queryKey: ['nutrition-db'] });
          void qc.invalidateQueries({ queryKey: ['nutrition-db', 'picker'] });
        }}
        createHint="Admin-created foods are published immediately (approved and active for coaches and the app)."
      />

      {confirmDialog}
    </div>
  );
}
