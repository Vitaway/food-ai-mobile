import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  createNutritionFood,
  fetchNutritionCategories,
  submitNutritionFood,
  updateNutritionFood,
  uploadNutritionFoodImage,
  type NutritionFood,
  type UpsertNutritionFoodPayload,
} from '@/api/nutritionDbApi';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { MANUAL_SERVING_UNITS, coerceServingUnit, servingUnitLabel } from '@/lib/servingUnits';
import {
  CLINICAL_NUTRIENT_PANEL,
  DATA_SOURCES,
  FOOD_ALLERGENS,
  PREPARATION_STATES,
  atwaterCheck,
} from '@/lib/clinicalNutrition';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

type ServingFormRow = {
  unit: string;
  amount: string;
  gramsEquivalent: string;
  isDefault: boolean;
};

type NutrientCell = { value: string; unknown: boolean };

const EMPTY_SERVING: ServingFormRow = {
  unit: 'piece',
  amount: '1',
  gramsEquivalent: '85',
  isDefault: true,
};

type FoodFormState = {
  name: string;
  nameRw: string;
  category: string;
  preparationState: string;
  ediblePortionFactor: string;
  searchSynonyms: string;
  brand: string;
  barcode: string;
  source: string;
  sourceReference: string;
  allergens: string[];
  nutrients: Record<string, NutrientCell>;
  servings: ServingFormRow[];
};

function emptyNutrients(): Record<string, NutrientCell> {
  return Object.fromEntries(
    CLINICAL_NUTRIENT_PANEL.map((n) => [n.key, { value: '', unknown: false }]),
  );
}

const EMPTY_FORM: FoodFormState = {
  name: '',
  nameRw: '',
  category: 'Vegetables',
  preparationState: 'Raw',
  ediblePortionFactor: '1.00',
  searchSynonyms: '',
  brand: '',
  barcode: '',
  source: 'TFCT 2008',
  sourceReference: '',
  allergens: [],
  nutrients: emptyNutrients(),
  servings: [{ ...EMPTY_SERVING }],
};

function formFromFood(food: NutritionFood): FoodFormState {
  const unknown = new Set(food.nutrientsUnknown ?? []);
  const composition = food.composition ?? {};
  const nutrients = emptyNutrients();
  for (const n of CLINICAL_NUTRIENT_PANEL) {
    if (unknown.has(n.key)) {
      nutrients[n.key] = { value: '', unknown: true };
    } else if (composition[n.key] != null && Number.isFinite(Number(composition[n.key]))) {
      nutrients[n.key] = { value: String(composition[n.key]), unknown: false };
    }
  }
  return {
    name: food.name,
    nameRw: food.nameRw ?? '',
    category: food.category,
    preparationState: food.preparationState ?? 'Raw',
    ediblePortionFactor: String(food.ediblePortionFactor ?? 1),
    searchSynonyms: (food.searchSynonyms ?? []).join(', '),
    brand: food.brand ?? '',
    barcode: food.barcode ?? '',
    source: food.source ?? '',
    sourceReference: food.sourceReference ?? food.sourceVersion ?? '',
    allergens: food.allergens ?? [],
    nutrients,
    servings:
      food.servings.length > 0
        ? food.servings.map((serving) => ({
            unit: coerceServingUnit(serving.unit),
            amount: String(serving.amount),
            gramsEquivalent: String(serving.gramsEquivalent),
            isDefault: serving.isDefault,
          }))
        : [{ ...EMPTY_SERVING }],
  };
}

function buildPayload(form: FoodFormState): UpsertNutritionFoodPayload {
  const composition: Record<string, number> = {};
  const nutrientsUnknown: string[] = [];
  for (const n of CLINICAL_NUTRIENT_PANEL) {
    const cell = form.nutrients[n.key];
    if (cell?.unknown) {
      nutrientsUnknown.push(n.key);
      continue;
    }
    if (cell?.value.trim() !== '' && Number.isFinite(Number(cell.value))) {
      composition[n.key] = Number(cell.value);
    }
  }
  return {
    name: form.name.trim(),
    category: form.category,
    nameRw: form.nameRw.trim() || undefined,
    brand: form.brand.trim() || undefined,
    barcode: form.barcode.trim() || undefined,
    preparationState: form.preparationState,
    ediblePortionFactor: Number(form.ediblePortionFactor) || 1,
    searchSynonyms: form.searchSynonyms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    allergens: form.allergens,
    nutrientsUnknown,
    composition,
    source: form.source.trim() || undefined,
    sourceReference: form.sourceReference.trim() || undefined,
    servings: form.servings.map((serving) => ({
      unit: serving.unit,
      amount: Number(serving.amount),
      gramsEquivalent: Number(serving.gramsEquivalent),
      isDefault: serving.isDefault,
    })),
  };
}

function StatusChip({ label }: { label?: string }) {
  const cls =
    label === 'Verified'
      ? 'bg-emerald-50 text-emerald-800'
      : label === 'Pending'
        ? 'bg-amber-50 text-amber-800'
        : label === 'Rejected'
          ? 'bg-red-50 text-red-800'
          : 'bg-ash-grey-100 text-ash-grey-700';
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>{label ?? 'Draft'}</span>
  );
}

type NutritionFoodEditorModalProps = {
  open: boolean;
  editing: NutritionFood | null;
  onClose: () => void;
  onSaved: (food: NutritionFood) => void;
  /** coach → draft/submit; admin → publish */
  mode?: 'coach' | 'admin';
  createHint?: string;
};

export function NutritionFoodEditorModal({
  open,
  editing,
  onClose,
  onSaved,
  mode = 'admin',
  createHint,
}: NutritionFoodEditorModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
    enabled: open,
  });

  const servingUnits = useMemo(() => [...MANUAL_SERVING_UNITS], []);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromFood(editing) : { ...EMPTY_FORM, nutrients: emptyNutrients(), servings: [{ ...EMPTY_SERVING }] });
    setPendingImageFile(null);
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open, editing]);

  const compositionLive = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const n of CLINICAL_NUTRIENT_PANEL) {
      const cell = form.nutrients[n.key];
      if (cell?.unknown || !cell?.value.trim()) out[n.key] = null;
      else out[n.key] = Number(cell.value);
    }
    return out;
  }, [form.nutrients]);

  const energy = atwaterCheck(compositionLive);
  const filled = CLINICAL_NUTRIENT_PANEL.filter((n) => {
    const cell = form.nutrients[n.key];
    return cell && !cell.unknown && cell.value.trim() !== '';
  }).length;
  const unknownCount = CLINICAL_NUTRIENT_PANEL.filter((n) => form.nutrients[n.key]?.unknown).length;
  const sodiumMissing = !form.nutrients.sodium_mg?.unknown && !form.nutrients.sodium_mg?.value.trim();

  const saveMutation = useMutation({
    mutationFn: async (opts: { asDraft?: boolean; submit?: boolean }) => {
      const payload = buildPayload(form);
      if (mode === 'coach') {
        // Persist draft first; submit is a separate endpoint (avoids double status flips).
        payload.asDraft = true;
        payload.submitForReview = false;
      }
      let food: NutritionFood;
      if (editing) {
        food = await updateNutritionFood(editing.id, payload);
      } else {
        food = await createNutritionFood(payload);
      }
      if (opts.submit && mode === 'coach') {
        food = await submitNutritionFood(food.id);
      }
      if (pendingImageFile) food = await uploadNutritionFoodImage(food.id, pendingImageFile);
      return food;
    },
    onSuccess: (food, vars) => {
      toast.success(
        vars.submit
          ? `${food.name} submitted for review`
          : mode === 'coach'
            ? `${food.name} saved as draft`
            : editing
              ? 'Food updated'
              : 'Food published',
      );
      onSaved(food);
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save food')),
  });

  const canSubmit = Boolean(form.name.trim() && form.source.trim());
  const photoPreviewUrl =
    pendingImagePreview ?? (editing?.imageUrl ? resolveMediaUrl(editing.imageUrl) : null);

  function setNutrient(key: string, patch: Partial<NutrientCell>) {
    setForm((prev) => ({
      ...prev,
      nutrients: { ...prev.nutrients, [key]: { ...prev.nutrients[key], ...patch } },
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? editing.name : 'New food'}
      description={
        editing
          ? 'Single item. Composition per 100 g edible portion.'
          : createHint ??
            (mode === 'coach'
              ? 'Save as draft or submit for clinical review.'
              : 'Admin-created foods are published immediately.')
      }
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ash-grey-500">
            {filled} of {CLINICAL_NUTRIENT_PANEL.length} nutrients entered
            {unknownCount ? ` · ${unknownCount} marked unknown` : ''}
            {' · '}
            unknowns are hidden from clients rather than shown as zero
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {mode === 'coach' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!form.name.trim() || saveMutation.isPending}
                  onClick={() => void saveMutation.mutateAsync({ asDraft: true })}>
                  Save draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canSubmit || saveMutation.isPending}
                  onClick={() => void saveMutation.mutateAsync({ submit: true })}>
                  Submit for review
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={!form.name.trim() || saveMutation.isPending}
                onClick={() => void saveMutation.mutateAsync({})}>
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save to database'}
              </Button>
            )}
          </div>
        </div>
      }>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ash-grey-300 bg-ash-grey-50">
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-ash-grey-400">Photo</span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPendingImagePreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return URL.createObjectURL(file);
                });
                setPendingImageFile(file);
              }}
            />
          </div>
          {editing ? <StatusChip label={editing.displayStatus} /> : null}
        </div>

        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
            Identity
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ash-grey-600">Name (English)</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ash-grey-600">Izina (Kinyarwanda)</span>
              <input
                value={form.nameRw}
                onChange={(e) => setForm({ ...form, nameRw: e.target.value })}
                className="w-full rounded-lg border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ash-grey-600">Category</span>
              <Select
                aria-label="Category"
                size="sm"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={(categories.length ? categories : ['Vegetables']).map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-orange-800">Preparation state</span>
              <Select
                aria-label="Preparation state"
                size="sm"
                value={form.preparationState}
                onChange={(value) => setForm({ ...form, preparationState: value })}
                options={PREPARATION_STATES.map((s) => ({ value: s, label: s }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-orange-800">Edible portion factor</span>
              <input
                value={form.ediblePortionFactor}
                onChange={(e) => setForm({ ...form, ediblePortionFactor: e.target.value })}
                className="w-full rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2 font-mono text-sm outline-none focus:border-orange-400"
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs text-orange-800">Search synonyms</span>
              <input
                value={form.searchSynonyms}
                onChange={(e) => setForm({ ...form, searchSynonyms: e.target.value })}
                placeholder="isombe, cassava leaf, umuvange"
                className="w-full rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
            Macronutrients <span className="font-normal normal-case tracking-normal">per 100 g edible portion</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CLINICAL_NUTRIENT_PANEL.slice(0, 7).map((n) => {
              const cell = form.nutrients[n.key];
              return (
                <label key={n.key} className="relative block">
                  <span className="mb-1 block text-xs text-ash-grey-600">
                    {n.label} {n.unit}
                  </span>
                  <input
                    value={cell.unknown ? '' : cell.value}
                    disabled={cell.unknown}
                    placeholder={cell.unknown ? 'not available' : ''}
                    onChange={(e) => setNutrient(n.key, { value: e.target.value, unknown: false })}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 pr-9 font-mono text-sm outline-none',
                      cell.unknown
                        ? 'border-ash-grey-200 bg-ash-grey-100 text-ash-grey-400'
                        : 'border-ash-grey-200 focus:border-blue-spruce-400',
                    )}
                  />
                  <button
                    type="button"
                    title="Mark unknown"
                    onClick={() => setNutrient(n.key, { unknown: !cell.unknown, value: '' })}
                    className={cn(
                      'absolute right-1 top-[22px] h-8 w-7 rounded text-[10px] font-semibold',
                      cell.unknown ? 'text-amber-700' : 'text-ash-grey-400 hover:text-blue-spruce-700',
                    )}>
                    ?
                  </button>
                </label>
              );
            })}
          </div>
          {energy && Math.abs(energy.deltaPct) > 10 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Declared {Math.round(energy.declared)} kcal, calculated {Math.round(energy.calculated)}{' '}
              kcal from macros ({energy.deltaPct > 0 ? '+' : ''}
              {Math.round(energy.deltaPct)}%). Check the entry before submitting.
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
            Micronutrients
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CLINICAL_NUTRIENT_PANEL.slice(7).map((n) => {
              const cell = form.nutrients[n.key];
              return (
                <label key={n.key} className="relative block">
                  <span className="mb-1 block text-xs text-ash-grey-600">
                    {n.label} {n.unit}
                  </span>
                  <input
                    value={cell.unknown ? '' : cell.value}
                    disabled={cell.unknown}
                    placeholder={cell.unknown ? 'not available' : ''}
                    onChange={(e) => setNutrient(n.key, { value: e.target.value, unknown: false })}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 pr-9 font-mono text-sm outline-none',
                      cell.unknown
                        ? 'border-ash-grey-200 bg-ash-grey-100 text-ash-grey-400'
                        : 'border-ash-grey-200 focus:border-blue-spruce-400',
                    )}
                  />
                  <button
                    type="button"
                    title="Mark unknown"
                    onClick={() => setNutrient(n.key, { unknown: !cell.unknown, value: '' })}
                    className={cn(
                      'absolute right-1 top-[22px] h-8 w-7 rounded text-[10px] font-semibold',
                      cell.unknown ? 'text-amber-700' : 'text-ash-grey-400 hover:text-blue-spruce-700',
                    )}>
                    ?
                  </button>
                </label>
              );
            })}
          </div>
          {sodiumMissing ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Sodium not entered. This food will be excluded from hypertension screening until it has a
              value.
            </div>
          ) : null}
        </section>

        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
            Allergens
          </h3>
          <div className="flex flex-wrap gap-2">
            {FOOD_ALLERGENS.map((a) => {
              const on = form.allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      allergens: on ? prev.allergens.filter((x) => x !== a) : [...prev.allergens, a],
                    }))
                  }
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs',
                    on
                      ? 'border-red-300 bg-red-50 font-medium text-red-800'
                      : 'border-ash-grey-200 bg-white text-ash-grey-600',
                  )}>
                  {a}
                </button>
              );
            })}
          </div>
          {form.allergens.length ? (
            <p className="mt-2 text-xs text-red-700">
              Flagged: {form.allergens.join(', ')}. Clients with a matching allergy will not be shown
              this food.
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
            Provenance
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-ash-grey-600">Data source</span>
              <Select
                aria-label="Data source"
                size="sm"
                value={form.source || DATA_SOURCES[0]}
                onChange={(value) => setForm({ ...form, source: value })}
                options={DATA_SOURCES.map((s) => ({ value: s, label: s }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ash-grey-600">Reference</span>
              <input
                value={form.sourceReference}
                onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                placeholder="code 04021"
                className="w-full rounded-lg border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ash-grey-500">
              Serving profiles
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  servings: [
                    ...form.servings,
                    { ...EMPTY_SERVING, isDefault: form.servings.length === 0 },
                  ],
                })
              }>
              + Add serving
            </Button>
          </div>
          {form.servings.map((serving, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-ash-grey-100 bg-ash-grey-50/50 p-3 sm:grid-cols-5">
              <Select
                aria-label={`Serving unit ${index + 1}`}
                size="sm"
                value={serving.unit}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    servings: prev.servings.map((row, idx) =>
                      idx === index ? { ...row, unit: value } : row,
                    ),
                  }))
                }
                options={servingUnits.map((unit) => ({
                  value: unit,
                  label: servingUnitLabel(unit),
                }))}
              />
              <input
                value={serving.amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    servings: prev.servings.map((row, idx) =>
                      idx === index ? { ...row, amount: e.target.value } : row,
                    ),
                  }))
                }
                className="rounded-lg border border-ash-grey-200 bg-white px-2 py-2 text-sm"
              />
              <input
                value={serving.gramsEquivalent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    servings: prev.servings.map((row, idx) =>
                      idx === index ? { ...row, gramsEquivalent: e.target.value } : row,
                    ),
                  }))
                }
                className="rounded-lg border border-ash-grey-200 bg-white px-2 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="defaultServing"
                  checked={serving.isDefault}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      servings: prev.servings.map((row, idx) => ({
                        ...row,
                        isDefault: idx === index,
                      })),
                    }))
                  }
                />
                Default
              </label>
              {form.servings.length > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      servings: form.servings.filter((_, idx) => idx !== index),
                    })
                  }>
                  Remove
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}
