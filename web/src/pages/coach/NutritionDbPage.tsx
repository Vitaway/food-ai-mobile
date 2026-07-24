import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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
import { MANUAL_SERVING_UNITS, coerceServingUnit, servingUnitLabel } from '@/lib/servingUnits';
import { cn } from '@/lib/utils';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  createNutritionFood,
  fetchNutritionCategories,
  fetchNutritionFoodsPage,
  lookupNutritionBarcode,
  NUTRITION_FOODS_PAGE_SIZE,
  updateNutritionFood,
  uploadNutritionFoodImage,
  type NutritionFood,
} from '@/api/nutritionDbApi';

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
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : previewUrl ? 'Change photo' : 'Upload photo'}
        </Button>
        {previewUrl ? (
          <Button variant="ghost" size="sm" disabled={uploading} onClick={onClear}>
            Remove
          </Button>
        ) : null}
      </div>
      <p className="mt-2 max-w-[11rem] text-center text-xs leading-relaxed text-ash-grey-500">
        Reference photo helps coaches visually confirm a match during review.
      </p>
    </div>
  );
}

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

function FoodForm({
  form,
  setForm,
  categories,
  servingUnits,
  photoPreviewUrl,
  photoUploading,
  onSelectPhoto,
  onClearPhoto,
}: {
  form: FoodFormState;
  setForm: React.Dispatch<React.SetStateAction<FoodFormState>>;
  categories: string[];
  servingUnits: string[];
  photoPreviewUrl: string | null;
  photoUploading?: boolean;
  onSelectPhoto: (file: File) => void;
  onClearPhoto: () => void;
}) {
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <ReferencePhotoField
        previewUrl={photoPreviewUrl}
        uploading={photoUploading}
        onSelectFile={onSelectPhoto}
        onClear={onClearPhoto}
      />

      <div className="min-w-0 flex-1 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Food name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Brown bread"
            className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Category</span>
          <Select
            aria-label="Food category"
            size="sm"
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
            options={categories.map((item) => ({ value: item, label: item }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Brand</span>
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Optional"
            className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Barcode</span>
          <input
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            placeholder="Optional"
            className="w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Nutrition per 100g</p>
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Micronutrients (per 100g)</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Serving profiles</p>
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
                servings: [...form.servings, { ...EMPTY_SERVING, isDefault: form.servings.length === 0 }],
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
              aria-label={`Serving count ${index + 1}`}
              title="How many of this unit (e.g. 10 pieces)"
              className="rounded-lg border border-ash-grey-200 bg-white px-2 py-2 text-sm"
            />
            <input
              value={serving.gramsEquivalent}
              onChange={(e) => updateServing(index, { gramsEquivalent: e.target.value })}
              placeholder="Total grams"
              aria-label={`Grams for that count ${index + 1}`}
              title="Total grams for that many units (e.g. 85g for 10 pieces)"
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
  );
}

function StatusBadge({ food }: { food: NutritionFood }) {
  if (food.approvalStatus === 'pending') {
    return (
      <span className="rounded-full bg-cinnamon-wood-100 px-2.5 py-1 text-xs font-semibold text-cinnamon-wood-700">
        Pending
      </span>
    );
  }
  if (!food.isActive) {
    return (
      <span className="rounded-full bg-ash-grey-100 px-2.5 py-1 text-xs font-semibold text-ash-grey-600">
        Archived
      </span>
    );
  }
  return (
    <span className="rounded-full bg-shamrock-50 px-2.5 py-1 text-xs font-semibold text-shamrock-700">
      Active
    </span>
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<NutritionFood | null>(null);
  const [compositionFood, setCompositionFood] = useState<NutritionFood | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
  });

  const servingUnits = useMemo(() => [...MANUAL_SERVING_UNITS], []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['coach', 'nutrition-db', deferredQ, category, page],
    queryFn: () =>
      fetchNutritionFoodsPage({
        q: deferredQ || undefined,
        category,
        includeInactive: true,
        page,
        pageSize: NUTRITION_FOODS_PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    setPage(1);
  }, [deferredQ, category]);

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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] });
      closeModal();
    },
  });

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

  async function handleSave() {
    const ok = await confirm({
      title: editing ? 'Save food changes?' : 'Add food to database?',
      description: editing
        ? `Update “${form.name.trim() || editing.name}” with the values in this form.`
        : `Create “${form.name.trim()}”. Coach submissions may require admin approval before they go live.`,
      confirmLabel: editing ? 'Save changes' : 'Save to database',
    });
    if (!ok) return;
    saveMutation.mutate();
  }

  const imageMutation = useMutation({
    mutationFn: ({ foodId, file }: { foodId: string; file: File }) => uploadNutritionFoodImage(foodId, file),
    onSuccess: (food) => {
      void qc.invalidateQueries({ queryKey: ['coach', 'nutrition-db'] });
      if (editing?.id === food.id) {
        setEditing(food);
        setPendingImage(null);
      }
    },
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
    setForm(EMPTY_FORM);
    setPendingImage(null);
  }

  function openAddModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPendingImage(null);
    setModalOpen(true);
  }

  function openEditModal(food: NutritionFood) {
    setEditing(food);
    setForm(formFromFood(food));
    setPendingImage(null);
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
          <Button variant="primary" icon={<PlusIcon />} onClick={openAddModal}>
            Add food
          </Button>
        }
      />

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

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : 'Add food'}
        description={
          editing
            ? 'Update the reference photo, nutrition data, servings, and barcode for this entry.'
            : 'Add a reference photo and nutrition details. Coach submissions require admin approval.'
        }
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={!form.name.trim() || saveMutation.isPending || imageMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Save to database'}
            </Button>
          </div>
        }>
        <FoodForm
          form={form}
          setForm={setForm}
          categories={categories}
          servingUnits={servingUnits}
          photoPreviewUrl={photoPreviewUrl}
          photoUploading={saveMutation.isPending || imageMutation.isPending}
          onSelectPhoto={setPendingImage}
          onClearPhoto={() => setPendingImage(null)}
        />
      </Modal>

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

      {confirmDialog}
    </div>
  );
}
