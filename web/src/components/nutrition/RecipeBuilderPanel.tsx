import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FoodDbPicker } from '@/components/coach/FoodDbPicker';
import { TfctCompositionGrid } from '@/components/nutrition/TfctCompositionGrid';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { FieldLabel, TextField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
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

type RecipeFormState = {
  name: string;
  nameRw: string;
  cookedYieldG: string;
  servingUnit: string;
  servingWeightG: string;
  ingredients: IngredientDraft[];
};

const EMPTY_FORM: RecipeFormState = {
  name: '',
  nameRw: '',
  cookedYieldG: '',
  servingUnit: 'cup',
  servingWeightG: '250',
  ingredients: [],
};

function formFromRecipe(recipe: NutritionRecipe): RecipeFormState {
  const serving = recipe.servings.find((s) => s.isDefault) ?? recipe.servings[0];
  return {
    name: recipe.name,
    nameRw: recipe.nameRw ?? '',
    cookedYieldG: recipe.cookedYieldG != null ? String(recipe.cookedYieldG) : '',
    servingUnit: serving?.unit ?? 'cup',
    servingWeightG: serving ? String(serving.gramsEquivalent) : '250',
    ingredients: recipe.ingredients.map((ing: RecipeIngredient, idx) => ({
      key: ing.id ?? `${ing.ingredientFoodId}-${idx}`,
      ingredientFoodId: ing.ingredientFoodId,
      name: ing.name,
      rawWeightG: String(ing.rawWeightG),
    })),
  };
}

function toPayload(form: RecipeFormState) {
  const cookedYieldG = Number(form.cookedYieldG);
  const servingWeightG = Number(form.servingWeightG);
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
    servings: [
      {
        unit: form.servingUnit === 'spoon' ? 'tbsp' : form.servingUnit,
        amount: 1,
        gramsEquivalent: servingWeightG,
        isDefault: true,
      },
    ],
  };
}

export function RecipeBuilderPanel() {
  const toast = useToast();
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
      if (!payload.nameRw && !form.nameRw.trim()) {
        // nameRw optional but strongly recommended — still allow save
      }
      if (!(payload.cookedYieldG > 0)) throw new Error('Cooked yield weight (g) is required');
      if (!payload.ingredients.length) throw new Error('Add at least one ingredient');
      if (!(Number(form.servingWeightG) > 0)) throw new Error('Serving weight (g) is required');
      if (editing) return updateNutritionRecipe(editing.id, payload);
      return createNutritionRecipe(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Recipe updated' : 'Recipe created');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ['nutrition-recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['nutrition-foods'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save recipe')),
  });

  const previewKey = useMemo(
    () =>
      JSON.stringify({
        cookedYieldG: form.cookedYieldG,
        servingWeightG: form.servingWeightG,
        ingredients: form.ingredients.map((i) => ({
          id: i.ingredientFoodId,
          w: i.rawWeightG,
        })),
      }),
    [form.cookedYieldG, form.servingWeightG, form.ingredients],
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
        servingWeightG: Number(form.servingWeightG) || undefined,
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
    setForm(EMPTY_FORM);
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

  const recipes = recipesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          className="min-w-[12rem] flex-1 sm:max-w-xs"
          value={q}
          onValueChange={setQ}
          placeholder="Search recipes (EN / Kinyarwanda)…"
          size="sm"
        />
        <Button variant="primary" onClick={openCreate}>
          Add recipe
        </Button>
      </div>

      <DashboardPanel title="Recipes / dishes">
        {recipesQuery.isLoading ? (
          <p className="px-4 py-6 text-sm text-ash-grey-500">Loading recipes…</p>
        ) : recipes.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ash-grey-500">
            No recipes yet. Build a dish from Nutrition Database ingredients (e.g. Sombe / Isombe).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-200 text-[11px] uppercase tracking-wide text-ash-grey-500">
                  <th className="px-4 py-2 font-semibold">Name</th>
                  <th className="px-4 py-2 font-semibold">Kinyarwanda</th>
                  <th className="px-4 py-2 font-semibold">Ingredients</th>
                  <th className="px-4 py-2 font-semibold">Cooked yield</th>
                  <th className="px-4 py-2 font-semibold">Serving</th>
                  <th className="px-4 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => {
                  const serving = recipe.servings.find((s) => s.isDefault) ?? recipe.servings[0];
                  return (
                    <tr key={recipe.id} className="border-b border-ash-grey-100">
                      <td className="px-4 py-3 font-medium text-ash-grey-900">{recipe.name}</td>
                      <td className="px-4 py-3 text-ash-grey-600">{recipe.nameRw ?? '—'}</td>
                      <td className="px-4 py-3 text-ash-grey-600">{recipe.ingredients.length}</td>
                      <td className="px-4 py-3 tabular-nums text-ash-grey-700">
                        {recipe.cookedYieldG != null ? `${recipe.cookedYieldG} g` : '—'}
                      </td>
                      <td className="px-4 py-3 text-ash-grey-600">
                        {serving
                          ? `1 ${serving.unit} = ${serving.gramsEquivalent} g`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(recipe)}>
                          Edit
                        </Button>
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
        description="Raw ingredient weights → cooked yield → per-serving profile (clinical yield method).">
        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-1 py-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Name (English)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Sombe"
            />
            <TextField
              label="Name (Kinyarwanda)"
              value={form.nameRw}
              onChange={(e) => setForm((p) => ({ ...p, nameRw: e.target.value }))}
              placeholder="Isombe"
            />
          </div>

          <div>
            <FieldLabel>Add ingredient (from Nutrition DB)</FieldLabel>
            <FoodDbPicker onSelect={addIngredient} className="mt-1" />
          </div>

          {form.ingredients.length ? (
            <div className="space-y-2 rounded-xl border border-ash-grey-100 p-3">
              {form.ingredients.map((ing) => (
                <div key={ing.key} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <p className="text-sm font-medium text-ash-grey-900">{ing.name}</p>
                    <p className="text-xs text-ash-grey-500">Raw weight (g)</p>
                  </div>
                  <input
                    type="number"
                    min={0.01}
                    step="0.1"
                    value={ing.rawWeightG}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ingredients: prev.ingredients.map((row) =>
                          row.key === ing.key ? { ...row, rawWeightG: e.target.value } : row,
                        ),
                      }))
                    }
                    className="w-28 rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm"
                  />
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ash-grey-500">No ingredients yet.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Cooked yield weight (g)"
              type="number"
              value={form.cookedYieldG}
              onChange={(e) => setForm((p) => ({ ...p, cookedYieldG: e.target.value }))}
              placeholder="e.g. 800"
            />
            <div>
              <FieldLabel>Serving unit</FieldLabel>
              <Select
                className="mt-1 w-full"
                value={form.servingUnit}
                onChange={(value) => setForm((p) => ({ ...p, servingUnit: value }))}
                options={RECIPE_SERVING_UNITS.map((u) => ({ value: u.value, label: u.label }))}
              />
            </div>
            <TextField
              label="Serving weight (g)"
              type="number"
              value={form.servingWeightG}
              onChange={(e) => setForm((p) => ({ ...p, servingWeightG: e.target.value }))}
              placeholder="e.g. 250"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Per 100 g cooked
              </p>
              <TfctCompositionGrid composition={previewPer100g} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Per serving ({form.servingWeightG || '—'} g)
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
