import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  createNutritionFood,
  fetchNutritionCategories,
  updateNutritionFood,
  uploadNutritionFoodImage,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { MANUAL_SERVING_UNITS, coerceServingUnit, servingUnitLabel } from '@/lib/servingUnits';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

type ServingFormRow = {
  unit: string;
  amount: string;
  gramsEquivalent: string;
  isDefault: boolean;
};

const MICRONUTRIENT_FIELDS = [
  { key: 'ironMg', label: 'Iron (mg)' },
  { key: 'calciumMg', label: 'Calcium (mg)' },
  { key: 'vitaminCMg', label: 'Vitamin C (mg)' },
  { key: 'vitaminAMcg', label: 'Vitamin A (mcg)' },
  { key: 'zincMg', label: 'Zinc (mg)' },
] as const;

const EMPTY_SERVING: ServingFormRow = {
  unit: 'piece',
  amount: '1',
  gramsEquivalent: '85',
  isDefault: true,
};

const EMPTY_FORM = {
  name: '',
  category: 'Staples',
  brand: '',
  barcode: '',
  calories: '100',
  proteinG: '5',
  carbsG: '15',
  fatG: '3',
  fiberG: '2',
  micronutrients: {} as Record<string, string>,
  servings: [{ ...EMPTY_SERVING }] as ServingFormRow[],
};

type FoodFormState = typeof EMPTY_FORM;

function formFromFood(food: NutritionFood): FoodFormState {
  return {
    name: food.name,
    category: food.category,
    brand: food.brand ?? '',
    barcode: food.barcode ?? '',
    calories: String(food.nutritionPer100g.caloriesKcal ?? ''),
    proteinG: String(food.nutritionPer100g.proteinG ?? ''),
    carbsG: String(food.nutritionPer100g.carbsG ?? ''),
    fatG: String(food.nutritionPer100g.fatG ?? ''),
    fiberG: String(food.nutritionPer100g.fiberG ?? ''),
    micronutrients: Object.fromEntries(
      MICRONUTRIENT_FIELDS.map((field) => [
        field.key,
        food.micronutrients[field.key] != null ? String(food.micronutrients[field.key]) : '',
      ]),
    ),
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

function ReferencePhotoField({
  previewUrl,
  uploading,
  onSelectFile,
  onClear,
}: {
  previewUrl: string | null;
  uploading?: boolean;
  onSelectFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex shrink-0 flex-col items-center lg:w-44">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'flex h-36 w-36 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          previewUrl
            ? 'border-blue-spruce-200 bg-white'
            : 'border-ash-grey-300 bg-ash-grey-50 hover:border-blue-spruce-300 hover:bg-blue-spruce-50/40',
        )}>
        {previewUrl ? (
          <img src={previewUrl} alt="Reference" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-ash-grey-300" aria-hidden>
            <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          e.target.value = '';
        }}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {previewUrl ? 'Change' : 'Upload'}
        </Button>
        {previewUrl ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </div>
      <p className="mt-2 max-w-[11rem] text-center text-xs leading-relaxed text-ash-grey-500">
        Reference photo helps coaches confirm a match during review.
      </p>
    </div>
  );
}

type NutritionFoodEditorModalProps = {
  open: boolean;
  editing: NutritionFood | null;
  onClose: () => void;
  onSaved: (food: NutritionFood) => void;
  /** Shown under the title for create vs edit. */
  createHint?: string;
};

export function NutritionFoodEditorModal({
  open,
  editing,
  onClose,
  onSaved,
  createHint = 'Admin-created foods are published immediately (approved + active).',
}: NutritionFoodEditorModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
    enabled: open,
  });

  const servingUnits = useMemo(() => [...MANUAL_SERVING_UNITS], []);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromFood(editing) : { ...EMPTY_FORM, servings: [{ ...EMPTY_SERVING }] });
    setPendingImageFile(null);
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open, editing]);

  useEffect(() => {
    return () => {
      if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    };
  }, [pendingImagePreview]);

  const photoPreviewUrl =
    pendingImagePreview ?? (editing?.imageUrl ? resolveMediaUrl(editing.imageUrl) : null);

  function setPendingImage(file: File | null) {
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setPendingImageFile(file);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const micronutrients = Object.fromEntries(
        Object.entries(form.micronutrients)
          .filter(([, value]) => value.trim())
          .map(([key, value]) => [key, Number(value)]),
      );
      const payload = {
        name: form.name.trim(),
        category: form.category,
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        nutritionPer100g: {
          caloriesKcal: Number(form.calories),
          proteinG: Number(form.proteinG),
          carbsG: Number(form.carbsG),
          fatG: Number(form.fatG),
          fiberG: Number(form.fiberG),
        },
        micronutrients,
        servings: form.servings.map((serving) => ({
          unit: serving.unit,
          amount: Number(serving.amount),
          gramsEquivalent: Number(serving.gramsEquivalent),
          isDefault: serving.isDefault,
        })),
      };
      if (editing) {
        const updated = await updateNutritionFood(editing.id, payload);
        if (pendingImageFile) {
          return uploadNutritionFoodImage(updated.id, pendingImageFile);
        }
        return updated;
      }
      const created = await createNutritionFood(payload);
      if (pendingImageFile) {
        return uploadNutritionFoodImage(created.id, pendingImageFile);
      }
      return created;
    },
    onSuccess: (food) => {
      toast.success(editing ? 'Food updated' : 'Food added to database');
      onSaved(food);
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save food')),
  });

  function updateServing(index: number, patch: Partial<ServingFormRow>) {
    setForm((prev) => ({
      ...prev,
      servings: prev.servings.map((row, idx) => (idx === index ? { ...row, ...patch } : row)),
    }));
  }

  function setDefaultServing(index: number) {
    setForm((prev) => ({
      ...prev,
      servings: prev.servings.map((row, idx) => ({ ...row, isDefault: idx === index })),
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'Add food'}
      description={
        editing
          ? 'Update the reference photo, nutrition data, servings, and barcode for this entry.'
          : createHint
      }
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void saveMutation.mutateAsync()}
            disabled={!form.name.trim() || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save to database'}
          </Button>
        </div>
      }>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ReferencePhotoField
          previewUrl={photoPreviewUrl}
          uploading={saveMutation.isPending}
          onSelectFile={setPendingImage}
          onClear={() => setPendingImage(null)}
        />

        <div className="min-w-0 flex-1 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Food name
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Brown bread"
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Category
              </span>
              <Select
                aria-label="Food category"
                size="sm"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={(categories.length ? categories : ['Staples']).map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Brand
              </span>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Barcode
              </span>
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Nutrition per 100g
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {(
                [
                  ['calories', 'Calories', form.calories],
                  ['proteinG', 'Protein (g)', form.proteinG],
                  ['carbsG', 'Carbs (g)', form.carbsG],
                  ['fatG', 'Fat (g)', form.fatG],
                  ['fiberG', 'Fiber (g)', form.fiberG],
                ] as const
              ).map(([key, label, value]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs text-ash-grey-500">{label}</span>
                  <input
                    value={value}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Micronutrients (per 100g)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MICRONUTRIENT_FIELDS.map((field) => (
                <input
                  key={field.key}
                  value={form.micronutrients[field.key] ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      micronutrients: { ...form.micronutrients, [field.key]: e.target.value },
                    })
                  }
                  placeholder={field.label}
                  className="rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                  Serving profiles
                </p>
                <p className="mt-0.5 text-xs text-ash-grey-500">
                  Unit + how many + total grams (e.g. piece, 10, 85 = 10 pieces weigh 85g).
                </p>
              </div>
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
                className="grid gap-2 rounded-2xl border border-ash-grey-100 bg-ash-grey-50/50 p-3 sm:grid-cols-5">
                <Select
                  aria-label={`Serving unit ${index + 1}`}
                  size="sm"
                  value={serving.unit}
                  onChange={(value) => updateServing(index, { unit: value })}
                  options={servingUnits.map((unit) => ({
                    value: unit,
                    label: servingUnitLabel(unit),
                  }))}
                />
                <input
                  value={serving.amount}
                  onChange={(e) => updateServing(index, { amount: e.target.value })}
                  placeholder="How many"
                  className="rounded-lg border border-ash-grey-200 bg-white px-2 py-2 text-sm"
                />
                <input
                  value={serving.gramsEquivalent}
                  onChange={(e) => updateServing(index, { gramsEquivalent: e.target.value })}
                  placeholder="Total grams"
                  className="rounded-lg border border-ash-grey-200 bg-white px-2 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-ash-grey-700">
                  <input
                    type="radio"
                    name="defaultServing"
                    checked={serving.isDefault}
                    onChange={() => setDefaultServing(index)}
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
          </div>
        </div>
      </div>
    </Modal>
  );
}
