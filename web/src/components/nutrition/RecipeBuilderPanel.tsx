import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FoodDbPicker } from '@/components/coach/FoodDbPicker';
import { TfctCompositionGrid } from '@/components/nutrition/TfctCompositionGrid';
import { ArchiveIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { FieldLabel, TextField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/context/ToastContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { servingUnitLabel } from '@/lib/servingUnits';
import {
  archiveNutritionRecipe,
  createNutritionRecipe,
  fetchNutritionRecipes,
  previewNutritionRecipe,
  updateNutritionRecipe,
  type NutritionRecipe,
  type RecipeIngredient,
} from '@/api/nutritionRecipeApi';
import type { NutritionFood } from '@/api/nutritionDbApi';

const RECIPE_SERVING_UNITS = [
  { value: 'cup', label: 'Cup' },
  { value: 'plate', label: 'Plate' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'tbsp', label: 'Spoon (tbsp)' },
  { value: 'piece', label: 'Piece' },
] as const;

type IngredientDraft = {
  key: string;
  ingredientFoodId: string;
  name: string;
  rawWeightG: string;
};

type ServingDraft = {
  key: string;
  unit: string;
  amount: string;
  gramsEquivalent: string;
  isDefault: boolean;
};

type RecipeFormState = {
  name: string;
  nameRw: string;
  cookedYieldG: string;
  ingredients: IngredientDraft[];
  servings: ServingDraft[];
};

const EMPTY_SERVING = (): ServingDraft => ({
  key: `srv-${Date.now()}`,
  unit: 'cup',
  amount: '1',
  gramsEquivalent: '250',
  isDefault: true,
});

const EMPTY_FORM = (): RecipeFormState => ({
  name: '',
  nameRw: '',
  cookedYieldG: '',
  ingredients: [],
  servings: [EMPTY_SERVING()],
});

function formFromRecipe(recipe: NutritionRecipe): RecipeFormState {
  const servings =
    recipe.servings.length > 0
      ? recipe.servings.map((s, idx) => ({
          key: s.id ?? `srv-${idx}`,
          unit: s.unit,
          amount: String(s.amount ?? 1),
          gramsEquivalent: String(s.gramsEquivalent),
          isDefault: s.isDefault,
        }))
      : [EMPTY_SERVING()];
  if (!servings.some((s) => s.isDefault) && servings[0]) servings[0].isDefault = true;
  return {
    name: recipe.name,
    nameRw: recipe.nameRw ?? '',
    cookedYieldG: recipe.cookedYieldG != null ? String(recipe.cookedYieldG) : '',
    ingredients: recipe.ingredients.map((ing: RecipeIngredient, idx) => ({
      key: ing.id ?? `${ing.ingredientFoodId}-${idx}`,
      ingredientFoodId: ing.ingredientFoodId,
      name: ing.name,
      rawWeightG: String(ing.rawWeightG),
    })),
    servings,
  };
}

function defaultServingGrams(form: RecipeFormState): number {
  const def = form.servings.find((s) => s.isDefault) ?? form.servings[0];
  return Number(def?.gramsEquivalent) || 0;
}

function toPayload(form: RecipeFormState) {
  const cookedYieldG = Number(form.cookedYieldG);
  const servings = form.servings
    .filter((s) => Number(s.gramsEquivalent) > 0)
    .map((s, idx) => ({
      unit: s.unit === 'spoon' ? 'tbsp' : s.unit,
      amount: Number(s.amount) > 0 ? Number(s.amount) : 1,
      gramsEquivalent: Number(s.gramsEquivalent),
      isDefault: s.isDefault || idx === 0,
    }));
  // Ensure exactly one default
  if (servings.length && !servings.some((s) => s.isDefault)) {
    servings[0]!.isDefault = true;
  }
  return {
    name: form.name.trim(),
    nameRw: form.nameRw.trim() || undefined,
    category: 'Traditional dishes',
    cookedYieldG,
    ingredients: form.ingredients
      .filter((ing) => ing.ingredientFoodId && Number(ing.rawWeightG) > 0)
      .map((ing, idx) => ({
        ingredientFoodId: ing.ingredientFoodId,
        rawWeightG: Number(ing.rawWeightG),
        sortOrder: idx,
      })),
    servings,
  };
}

export function RecipeBuilderPanel() {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NutritionRecipe | null>(null);
  const [form, setForm] = useState<RecipeFormState>(EMPTY_FORM);
  const [previewPer100g, setPreviewPer100g] = useState<Record<string, number> | null>(null);
  const [previewPerServing, setPreviewPerServing] = useState<Record<string, number> | null>(null);

  const recipesQuery = useQuery({
    queryKey: ['nutrition-recipes', q],
    queryFn: () => fetchNutritionRecipes(q),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (!payload.name) throw new Error('Recipe name (English) is required');
      if (!(payload.cookedYieldG > 0)) throw new Error('Cooked yield weight (g) is required');
      if (!payload.ingredients.length) throw new Error('Add at least one ingredient');
      if (!payload.servings?.length) throw new Error('Add at least one serving profile');
      if (editing) return updateNutritionRecipe(editing.id, payload);
      return createNutritionRecipe(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Recipe updated' : 'Recipe created');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM());
      void queryClient.invalidateQueries({ queryKey: ['nutrition-recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition-db', 'picker'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save recipe')),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveNutritionRecipe(id),
    onSuccess: () => {
      toast.success('Recipe archived');
      void queryClient.invalidateQueries({ queryKey: ['nutrition-recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition-db', 'picker'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not archive recipe')),
  });

  const servingWeightG = defaultServingGrams(form);
  const rawTotalG = useMemo(
    () =>
      form.ingredients.reduce((sum, ing) => sum + (Number(ing.rawWeightG) || 0), 0),
    [form.ingredients],
  );
  const cookedYieldG = Number(form.cookedYieldG) || 0;
  const yieldFactor =
    cookedYieldG > 0 && rawTotalG > 0
      ? Math.round((cookedYieldG / rawTotalG) * 1000) / 1000
      : null;
  const servingsProduced =
    cookedYieldG > 0 && servingWeightG > 0
      ? Math.round((cookedYieldG / servingWeightG) * 10) / 10
      : null;

  const previewKey = useMemo(
    () =>
      JSON.stringify({
        cookedYieldG: form.cookedYieldG,
        servingWeightG,
        ingredients: form.ingredients.map((i) => ({
          id: i.ingredientFoodId,
          w: i.rawWeightG,
        })),
      }),
    [form.cookedYieldG, servingWeightG, form.ingredients],
  );

  useEffect(() => {
    const payload = toPayload(form);
    if (!(payload.cookedYieldG > 0) || !payload.ingredients.length) {
      setPreviewPer100g(null);
      setPreviewPerServing(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void previewNutritionRecipe({
        cookedYieldG: payload.cookedYieldG,
        ingredients: payload.ingredients,
        servingWeightG: servingWeightG || undefined,
      })
        .then((preview) => {
          setPreviewPer100g(preview.per100g);
          setPreviewPerServing(preview.perServing);
        })
        .catch(() => {
          setPreviewPer100g(null);
          setPreviewPerServing(null);
        });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [previewKey]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM());
    setPreviewPer100g(null);
    setPreviewPerServing(null);
    setModalOpen(true);
  }

  function openEdit(recipe: NutritionRecipe) {
    setEditing(recipe);
    setForm(formFromRecipe(recipe));
    setPreviewPer100g(recipe.composition ?? null);
    setPreviewPerServing(recipe.perServing ?? null);
    setModalOpen(true);
  }

  function addIngredient(food: NutritionFood) {
    if (food.isRecipe || food.sourceType === 'recipe') {
      toast.error('Pick a single food — recipes cannot be nested as ingredients.');
      return;
    }
    setForm((prev) => {
      if (prev.ingredients.some((i) => i.ingredientFoodId === food.id)) return prev;
      return {
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            key: `${food.id}-${Date.now()}`,
            ingredientFoodId: food.id,
            name: food.name,
            rawWeightG: '100',
          },
        ],
      };
    });
  }

  async function handleArchive(recipe: NutritionRecipe) {
    const ok = await confirm({
      title: 'Archive recipe?',
      description: `"${recipe.name}" will be hidden from the Recipes tab and meal pickers. Existing meals that used it keep their logged nutrition.`,
      confirmLabel: 'Archive',
      tone: 'danger',
    });
    if (!ok) return;
    await archiveMutation.mutateAsync(recipe.id);
  }

  const recipes = recipesQuery.data ?? [];

  return (
    <div className="space-y-4">
      {confirmDialog}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="min-w-[12rem] flex-1 sm:max-w-xs"
          value={q}
          onValueChange={setQ}
          placeholder="Search recipes by English or Kinyarwanda name…"
          size="sm"
        />
        <Button variant="primary" onClick={openCreate}>
          New recipe
        </Button>
      </div>

      <DashboardPanel title="Recipes / dishes">
        {recipesQuery.isLoading ? (
          <p className="px-4 py-6 text-sm text-ash-grey-500">Loading recipes…</p>
        ) : recipes.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-ash-grey-500">
            <p className="font-medium text-ash-grey-800">No recipes yet</p>
            <p className="mt-1">
              Build a dish from foods already in the database (e.g. Isombe / cassava leaf stew).
            </p>
            <Button className="mt-4" variant="outline" size="sm" onClick={openCreate}>
              New recipe
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-200 text-[11px] uppercase tracking-wide text-ash-grey-500">
                  <th className="px-4 py-2 font-semibold">Recipe</th>
                  <th className="px-4 py-2 font-semibold">Yield</th>
                  <th className="px-4 py-2 font-semibold">Serving</th>
                  <th className="px-4 py-2 font-semibold">kcal / serving</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => {
                  const serving =
                    recipe.defaultServing ??
                    recipe.servings.find((s) => s.isDefault) ??
                    recipe.servings[0];
                  return (
                    <tr
                      key={recipe.id}
                      className="cursor-pointer border-b border-ash-grey-100 hover:bg-ash-grey-50/80"
                      onClick={() => openEdit(recipe)}>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-ash-grey-900">{recipe.name}</span>
                        <span className="text-xs text-ash-grey-500">
                          {recipe.nameRw || '—'}
                          {' · '}
                          {recipe.ingredientCount ?? recipe.ingredients.length} ingredients
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ash-grey-700">
                        {recipe.cookedYieldG != null ? `${recipe.cookedYieldG} g` : '—'}
                      </td>
                      <td className="px-4 py-3 text-ash-grey-600">
                        {serving
                          ? `1 ${servingUnitLabel(serving.unit)} = ${serving.gramsEquivalent} g`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ash-grey-700">
                        {recipe.kcalPerServing != null ? Math.round(recipe.kcalPerServing) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone="good">Active</StatusPill>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(recipe)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<ArchiveIcon />}
                            onClick={() => void handleArchive(recipe)}>
                            Archive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit recipe' : 'New recipe'}
        description="Raw ingredient weights → cooked yield → per-serving profile (clinical yield method)."
        size="xl">
        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-1 py-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Name (English)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Cassava leaf stew"
            />
            <TextField
              label="Izina (Kinyarwanda)"
              value={form.nameRw}
              onChange={(e) => setForm((p) => ({ ...p, nameRw: e.target.value }))}
              placeholder="Isombe"
            />
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Ingredients <span className="font-normal normal-case">— as purchased weights</span>
            </h3>
            <FoodDbPicker excludeRecipes onSelect={addIngredient} />
            {form.ingredients.length ? (
              <div className="overflow-hidden rounded-xl border border-ash-grey-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ash-grey-100 bg-ash-grey-50 text-[11px] uppercase tracking-wide text-ash-grey-500">
                      <th className="px-3 py-2 font-semibold">Food</th>
                      <th className="px-3 py-2 font-semibold">Raw weight (g)</th>
                      <th className="px-3 py-2 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.ingredients.map((ing) => (
                      <tr key={ing.key} className="border-b border-ash-grey-50">
                        <td className="px-3 py-2 font-medium text-ash-grey-900">{ing.name}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0.01}
                            step="0.1"
                            value={ing.rawWeightG}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                ingredients: prev.ingredients.map((row) =>
                                  row.key === ing.key
                                    ? { ...row, rawWeightG: e.target.value }
                                    : row,
                                ),
                              }))
                            }
                            className="w-28 rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                ingredients: prev.ingredients.filter((row) => row.key !== ing.key),
                              }))
                            }>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-ash-grey-200 px-4 py-6 text-center text-sm text-ash-grey-500">
                No ingredients yet. Search above to add the first one.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Yield</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FieldLabel>Raw edible total (g)</FieldLabel>
                <input
                  disabled
                  value={rawTotalG ? String(Math.round(rawTotalG * 10) / 10) : '—'}
                  className="mt-1 w-full rounded-lg border border-ash-grey-200 bg-ash-grey-50 px-3 py-2 text-sm tabular-nums text-ash-grey-700"
                />
              </div>
              <TextField
                label="Cooked yield weight (g)"
                type="number"
                value={form.cookedYieldG}
                onChange={(e) => setForm((p) => ({ ...p, cookedYieldG: e.target.value }))}
                placeholder="e.g. 1450"
              />
              <div>
                <FieldLabel>Yield factor</FieldLabel>
                <input
                  disabled
                  value={yieldFactor != null ? String(yieldFactor) : '—'}
                  className="mt-1 w-full rounded-lg border border-ash-grey-200 bg-ash-grey-50 px-3 py-2 text-sm tabular-nums text-ash-grey-700"
                />
              </div>
              <div>
                <FieldLabel>Servings produced</FieldLabel>
                <input
                  disabled
                  value={servingsProduced != null ? String(servingsProduced) : '—'}
                  className="mt-1 w-full rounded-lg border border-ash-grey-200 bg-ash-grey-50 px-3 py-2 text-sm tabular-nums text-ash-grey-700"
                />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Serving profiles{' '}
              <span className="font-normal normal-case">
                — a cup of stew and a cup of porridge are different weights
              </span>
            </h3>
            <div className="space-y-2">
              {form.servings.map((serving) => (
                <div
                  key={serving.key}
                  className="flex flex-wrap items-end gap-2 rounded-xl border border-ash-grey-100 bg-white p-3">
                  <label className="flex items-center gap-2 pb-2 text-xs text-ash-grey-600">
                    <input
                      type="radio"
                      name="default-serving"
                      checked={serving.isDefault}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          servings: prev.servings.map((s) => ({
                            ...s,
                            isDefault: s.key === serving.key,
                          })),
                        }))
                      }
                    />
                    Default
                  </label>
                  <div className="min-w-[8rem] flex-1">
                    <FieldLabel>Unit</FieldLabel>
                    <Select
                      className="mt-1 w-full"
                      value={serving.unit}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          servings: prev.servings.map((s) =>
                            s.key === serving.key ? { ...s, unit: value } : s,
                          ),
                        }))
                      }
                      options={RECIPE_SERVING_UNITS.map((u) => ({
                        value: u.value,
                        label: u.label,
                      }))}
                    />
                  </div>
                  <div className="w-20">
                    <TextField
                      label="Amount"
                      type="number"
                      value={serving.amount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          servings: prev.servings.map((s) =>
                            s.key === serving.key ? { ...s, amount: e.target.value } : s,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="w-28">
                    <TextField
                      label="Grams"
                      type="number"
                      value={serving.gramsEquivalent}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          servings: prev.servings.map((s) =>
                            s.key === serving.key
                              ? { ...s, gramsEquivalent: e.target.value }
                              : s,
                          ),
                        }))
                      }
                    />
                  </div>
                  {form.servings.length > 1 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setForm((prev) => {
                          const next = prev.servings.filter((s) => s.key !== serving.key);
                          if (next.length && !next.some((s) => s.isDefault)) {
                            next[0]!.isDefault = true;
                          }
                          return { ...prev, servings: next };
                        })
                      }>
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  servings: [
                    ...prev.servings,
                    {
                      key: `srv-${Date.now()}`,
                      unit: 'plate',
                      amount: '1',
                      gramsEquivalent: '400',
                      isDefault: false,
                    },
                  ],
                }))
              }>
              + Add serving
            </Button>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Per 100 g cooked
              </p>
              <TfctCompositionGrid composition={previewPer100g} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Per serving ({servingWeightG || '—'} g)
              </p>
              <TfctCompositionGrid composition={previewPerServing} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={saveMutation.isPending}
              onClick={() => void saveMutation.mutateAsync()}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save recipe' : 'Create recipe'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
