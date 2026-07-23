import { useQuery } from '@tanstack/react-query';
import type { DetectedFoodItem } from '@/types';
import {
  fetchNutritionFood,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import { FoodDbPicker } from '@/components/coach/FoodDbPicker';
import { Select } from '@/components/ui/Select';
import { nutritionFromPer100g } from '@/lib/nutrition';
import {
  MANUAL_SERVING_UNITS,
  applyServingMeasure,
  coerceServingUnit,
  defaultGramsForUnit,
  gramsPerUnit,
  pickDefaultServing,
  servingUnitLabel,
  type FoodServingOption,
} from '@/lib/servingUnits';
import { cn } from '@/lib/utils';

const thClass =
  'px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-ash-grey-500';
const tdClass = 'px-2.5 py-2 align-middle text-ash-grey-800';
const inputClass =
  'w-full min-w-0 rounded-md border border-ash-grey-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-spruce-400';
const readOnlyClass =
  'w-full min-w-0 rounded-md border border-transparent bg-ash-grey-50 px-2 py-1 text-sm text-ash-grey-700';

export function AiIngredientsTable({ items }: { items: DetectedFoodItem[] }) {
  if (!items.length) {
    return <p className="px-2 py-4 text-sm text-ash-grey-500">No ingredients detected.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-ash-grey-200">
            <th className={thClass}>Item</th>
            <th className={thClass}>Serving</th>
            <th className={thClass}>Weight</th>
            <th className={thClass}>Kcal</th>
            <th className={thClass}>P</th>
            <th className={thClass}>C</th>
            <th className={thClass}>F</th>
            <th className={thClass}>Conf.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-ash-grey-100 last:border-b-0">
              <td className={cn(tdClass, 'font-medium')}>
                <span className="mr-1.5">{item.emoji ?? '🍽️'}</span>
                {item.label}
              </td>
              <td className={tdClass}>
                {item.servingUnit ? `${item.servingAmount ?? 1} ${item.servingUnit}` : '—'}
              </td>
              <td className={tdClass}>{item.estimatedWeightG}g</td>
              <td className={tdClass}>{item.nutrition.caloriesKcal}</td>
              <td className={tdClass}>{item.nutrition.proteinG}g</td>
              <td className={tdClass}>{item.nutrition.carbsG}g</td>
              <td className={tdClass}>{item.nutrition.fatG}g</td>
              <td className={cn(tdClass, 'text-ash-grey-500')}>
                {Math.round(item.confidence * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type EditableProps = {
  items: DetectedFoodItem[];
  onUpdateItem: (id: string, patch: Partial<DetectedFoodItem>) => void;
  onUpdateWeight: (id: string, weightG: number) => void;
  onUpdateNutrition: (
    id: string,
    field: keyof DetectedFoodItem['nutrition'],
    value: number,
  ) => void;
  onRemove: (id: string) => void;
};

function applyFoodFromDb(food: NutritionFood): Partial<DetectedFoodItem> {
  const per100 = {
    caloriesKcal: food.nutritionPer100g.caloriesKcal ?? 0,
    proteinG: food.nutritionPer100g.proteinG ?? 0,
    carbsG: food.nutritionPer100g.carbsG ?? 0,
    fatG: food.nutritionPer100g.fatG ?? 0,
    fiberG: food.nutritionPer100g.fiberG ?? 0,
    sugarG: food.nutritionPer100g.sugarG,
    sodiumMg: food.nutritionPer100g.sodiumMg,
  };
  const defaultServing = pickDefaultServing(food.servings);
  const servingUnit = coerceServingUnit(defaultServing?.unit ?? 'g');
  // Always start at 1 of the chosen unit — never auto-fill 100.
  const measureAmount = 1;
  const servingGramsEquivalent = defaultServing
    ? gramsPerUnit(defaultServing)
    : defaultGramsForUnit(servingUnit);
  const grams = Math.round(measureAmount * servingGramsEquivalent * 100) / 100;

  return {
    label: food.name,
    foodSource: 'nutrition_db',
    nutritionFoodId: food.id,
    nutritionPer100g: per100,
    estimatedWeightG: grams > 0 ? grams : servingGramsEquivalent,
    nutrition: nutritionFromPer100g(per100, grams > 0 ? grams : servingGramsEquivalent),
    servingUnit,
    servingAmount: measureAmount,
    servingGramsEquivalent,
    confidence: 1,
  };
}

function CoachIngredientRow({
  item,
  onUpdateItem,
  onUpdateNutrition,
  onRemove,
}: {
  item: DetectedFoodItem;
  onUpdateItem: EditableProps['onUpdateItem'];
  onUpdateNutrition: EditableProps['onUpdateNutrition'];
  onRemove: EditableProps['onRemove'];
}) {
  const source = item.foodSource ?? 'manual';
  const fromDb = source === 'nutrition_db';
  const macrosLocked = fromDb;

  const { data: dbFood } = useQuery({
    queryKey: ['nutrition-db', 'food', item.nutritionFoodId],
    queryFn: () => fetchNutritionFood(item.nutritionFoodId!),
    enabled: fromDb && Boolean(item.nutritionFoodId),
    staleTime: 60_000,
  });

  const dbServings: FoodServingOption[] = dbFood?.servings ?? [];

  function handleSourceChange(next: 'nutrition_db' | 'manual') {
    if (next === 'nutrition_db') {
      onUpdateItem(item.id, {
        foodSource: 'nutrition_db',
        label: item.nutritionFoodId ? item.label : '',
        nutritionFoodId: item.nutritionFoodId,
      });
      return;
    }
    const amount = item.estimatedWeightG > 0 ? item.estimatedWeightG : 1;
    onUpdateItem(item.id, {
      foodSource: 'manual',
      nutritionFoodId: undefined,
      nutritionPer100g: undefined,
      servingUnit: 'g',
      servingAmount: amount,
      servingGramsEquivalent: 1,
    });
  }

  function handleFoodSelect(food: NutritionFood) {
    onUpdateItem(item.id, applyFoodFromDb(food));
  }

  function commitServing(next: {
    servingAmount: number;
    servingUnit: string;
    servingGramsEquivalent: number;
  }) {
    const updated = applyServingMeasure(item, next);
    onUpdateItem(item.id, {
      servingAmount: updated.servingAmount,
      servingUnit: updated.servingUnit,
      servingGramsEquivalent: updated.servingGramsEquivalent,
      estimatedWeightG: updated.estimatedWeightG,
      nutrition: updated.nutrition,
    });
  }

  function handleAmountChange(raw: number) {
    const servingAmount = Number.isFinite(raw) ? raw : 0;
    commitServing({
      servingAmount,
      servingUnit: item.servingUnit ?? 'g',
      servingGramsEquivalent: item.servingGramsEquivalent ?? defaultGramsForUnit(item.servingUnit ?? 'g'),
    });
  }

  function handleDbUnitChange(unit: string) {
    const serving = dbServings.find((s) => s.unit === unit);
    const perUnit = serving ? gramsPerUnit(serving) : defaultGramsForUnit(unit);
    const previousUnit = (item.servingUnit ?? 'g').toLowerCase();
    const nextUnit = unit.toLowerCase();
    let servingAmount = item.servingAmount ?? 1;
    if (nextUnit !== 'g' && (previousUnit === 'g' || servingAmount >= 100)) {
      servingAmount = 1;
    } else if (nextUnit === 'g' && previousUnit !== 'g') {
      servingAmount = item.estimatedWeightG || 1;
    }
    commitServing({
      servingAmount,
      servingUnit: unit,
      servingGramsEquivalent: perUnit,
    });
  }

  function handleManualUnitChange(unit: string) {
    const previousUnit = (item.servingUnit ?? 'g').toLowerCase();
    const nextUnit = unit.toLowerCase();
    let servingAmount = item.servingAmount ?? 1;
    if (nextUnit === 'g' && previousUnit !== 'g') {
      servingAmount = item.estimatedWeightG || 1;
    } else if (previousUnit === 'g' && nextUnit !== 'g') {
      servingAmount = 1;
    }
    commitServing({
      servingAmount,
      servingUnit: unit,
      servingGramsEquivalent: defaultGramsForUnit(unit),
    });
  }

  const unitOptions = (() => {
    if (fromDb) {
      const options = dbServings.length
        ? dbServings
            .map((s) => ({ ...s, unit: coerceServingUnit(s.unit) }))
            .filter((s, idx, arr) => arr.findIndex((x) => x.unit === s.unit) === idx)
            .map((s) => ({
              value: s.unit,
              label: s.unit === 'g' ? 'g' : `${servingUnitLabel(s.unit)} (${Math.round(gramsPerUnit(s))}g)`,
            }))
        : [{ value: coerceServingUnit(item.servingUnit), label: servingUnitLabel(item.servingUnit ?? 'g') }];
      const unit = coerceServingUnit(item.servingUnit ?? options[0]?.value ?? 'g');
      if (!options.some((o) => o.value === unit)) {
        return [{ value: unit, label: servingUnitLabel(unit) }, ...options];
      }
      return options;
    }
    return MANUAL_SERVING_UNITS.map((unit) => ({ value: unit, label: servingUnitLabel(unit) }));
  })();

  const currentUnit = coerceServingUnit(item.servingUnit ?? unitOptions[0]?.value ?? 'g');
  const displayAmount = item.servingAmount ?? 1;

  return (
    <tr className="border-b border-ash-grey-100 last:border-b-0">
      <td className={tdClass}>
        <Select
          aria-label="Ingredient source"
          size="sm"
          className="min-w-[7.5rem]"
          value={source}
          onChange={(value) => handleSourceChange(value as 'nutrition_db' | 'manual')}
          options={[
            { value: 'nutrition_db', label: 'Food DB' },
            { value: 'manual', label: 'Manual' },
            ...(source === 'ai' ? [{ value: 'ai', label: 'AI', disabled: true }] : []),
          ]}
        />
      </td>
      <td className={tdClass}>
        {fromDb ? (
          <FoodDbPicker
            valueId={item.nutritionFoodId}
            valueLabel={item.label}
            onSelect={handleFoodSelect}
          />
        ) : (
          <input
            className={cn(inputClass, 'min-w-[8rem] font-medium')}
            value={item.label}
            placeholder="Ingredient name"
            onChange={(e) => onUpdateItem(item.id, { label: e.target.value })}
          />
        )}
      </td>
      <td className={tdClass}>
        <Select
          aria-label="Serving unit"
          size="sm"
          className="min-w-[6.5rem]"
          value={currentUnit}
          onChange={(value) => (fromDb ? handleDbUnitChange(value) : handleManualUnitChange(value))}
          options={unitOptions}
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          min={0}
          step="any"
          aria-label="Serving amount"
          className={cn(inputClass, 'w-[4.5rem]')}
          value={displayAmount}
          onChange={(e) => handleAmountChange(Number(e.target.value))}
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          readOnly
          aria-label="Weight in grams"
          className={cn(readOnlyClass, 'w-16')}
          value={item.estimatedWeightG}
          title="Derived from serving amount × unit"
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          min={0}
          step="any"
          className={cn(macrosLocked ? readOnlyClass : inputClass, 'w-20')}
          value={item.nutrition.caloriesKcal}
          readOnly={macrosLocked}
          onChange={(e) => onUpdateNutrition(item.id, 'caloriesKcal', Number(e.target.value))}
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          min={0}
          step="any"
          className={cn(macrosLocked ? readOnlyClass : inputClass, 'w-16')}
          value={item.nutrition.proteinG}
          readOnly={macrosLocked}
          onChange={(e) => onUpdateNutrition(item.id, 'proteinG', Number(e.target.value))}
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          min={0}
          step="any"
          className={cn(macrosLocked ? readOnlyClass : inputClass, 'w-16')}
          value={item.nutrition.carbsG}
          readOnly={macrosLocked}
          onChange={(e) => onUpdateNutrition(item.id, 'carbsG', Number(e.target.value))}
        />
      </td>
      <td className={tdClass}>
        <input
          type="number"
          min={0}
          step="any"
          className={cn(macrosLocked ? readOnlyClass : inputClass, 'w-16')}
          value={item.nutrition.fatG}
          readOnly={macrosLocked}
          onChange={(e) => onUpdateNutrition(item.id, 'fatG', Number(e.target.value))}
        />
      </td>
      <td className={tdClass}>
        <button
          type="button"
          className="text-xs font-semibold text-red-600 hover:underline"
          onClick={() => onRemove(item.id)}>
          Remove
        </button>
      </td>
    </tr>
  );
}

export function CoachIngredientsTable({
  items,
  onUpdateItem,
  onUpdateWeight: _onUpdateWeight,
  onUpdateNutrition,
  onRemove,
}: EditableProps) {
  if (!items.length) {
    return (
      <p className="px-2 py-4 text-sm text-ash-grey-500">
        Add an ingredient — pick Food DB to search the catalog, or Manual to type values. Measure with
        serving amount and unit.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-ash-grey-200">
            <th className={thClass}>Source</th>
            <th className={cn(thClass, 'min-w-[14rem]')}>Item</th>
            <th className={thClass}>Unit</th>
            <th className={thClass}>Amount</th>
            <th className={thClass}>Weight (g)</th>
            <th className={thClass}>Kcal</th>
            <th className={thClass}>P</th>
            <th className={thClass}>C</th>
            <th className={thClass}>F</th>
            <th className={thClass} />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <CoachIngredientRow
              key={item.id}
              item={item}
              onUpdateItem={onUpdateItem}
              onUpdateNutrition={onUpdateNutrition}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReadOnlyIngredientsTable({ items }: { items: DetectedFoodItem[] }) {
  if (!items.length) return null;
  return <AiIngredientsTable items={items} />;
}
