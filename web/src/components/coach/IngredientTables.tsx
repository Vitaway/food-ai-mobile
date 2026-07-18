import type { DetectedFoodItem } from '@/types';
import type { NutritionFood } from '@/api/nutritionDbApi';
import { FoodDbPicker } from '@/components/coach/FoodDbPicker';
import { nutritionFromPer100g } from '@/lib/nutrition';
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

function applyFoodFromDb(food: NutritionFood, weightG: number): Partial<DetectedFoodItem> {
  const per100 = {
    caloriesKcal: food.nutritionPer100g.caloriesKcal ?? 0,
    proteinG: food.nutritionPer100g.proteinG ?? 0,
    carbsG: food.nutritionPer100g.carbsG ?? 0,
    fatG: food.nutritionPer100g.fatG ?? 0,
    fiberG: food.nutritionPer100g.fiberG ?? 0,
    sugarG: food.nutritionPer100g.sugarG,
    sodiumMg: food.nutritionPer100g.sodiumMg,
  };
  const defaultServing = food.servings.find((s) => s.isDefault) ?? food.servings[0];
  const grams =
    weightG > 0
      ? weightG
      : defaultServing?.gramsEquivalent && defaultServing.gramsEquivalent > 0
        ? defaultServing.gramsEquivalent
        : 100;

  return {
    label: food.name,
    foodSource: 'nutrition_db',
    nutritionFoodId: food.id,
    nutritionPer100g: per100,
    estimatedWeightG: grams,
    nutrition: nutritionFromPer100g(per100, grams),
    servingUnit: defaultServing?.unit,
    servingAmount: defaultServing?.amount,
    servingGramsEquivalent: defaultServing?.gramsEquivalent,
    confidence: 1,
  };
}

function CoachIngredientRow({
  item,
  onUpdateItem,
  onUpdateWeight,
  onUpdateNutrition,
  onRemove,
}: {
  item: DetectedFoodItem;
  onUpdateItem: EditableProps['onUpdateItem'];
  onUpdateWeight: EditableProps['onUpdateWeight'];
  onUpdateNutrition: EditableProps['onUpdateNutrition'];
  onRemove: EditableProps['onRemove'];
}) {
  const source = item.foodSource ?? 'manual';
  const fromDb = source === 'nutrition_db';
  const macrosLocked = fromDb;

  function handleSourceChange(next: 'nutrition_db' | 'manual') {
    if (next === 'nutrition_db') {
      onUpdateItem(item.id, {
        foodSource: 'nutrition_db',
        label: item.nutritionFoodId ? item.label : '',
        nutritionFoodId: item.nutritionFoodId,
      });
      return;
    }
    onUpdateItem(item.id, {
      foodSource: 'manual',
      nutritionFoodId: undefined,
      nutritionPer100g: undefined,
    });
  }

  function handleFoodSelect(food: NutritionFood) {
    onUpdateItem(item.id, applyFoodFromDb(food, item.estimatedWeightG || 100));
  }

  return (
    <tr className="border-b border-ash-grey-100 last:border-b-0">
      <td className={tdClass}>
        <select
          className={cn(inputClass, 'w-auto min-w-[7.5rem]')}
          value={source}
          onChange={(e) => handleSourceChange(e.target.value as 'nutrition_db' | 'manual')}>
          <option value="nutrition_db">Food DB</option>
          <option value="manual">Manual</option>
          {/* AI is display-only for detection-sourced rows — coaches cannot pick it */}
          {source === 'ai' ? (
            <option value="ai" disabled>
              AI
            </option>
          ) : null}
        </select>
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
        <input
          type="number"
          min={0}
          step="any"
          className={cn(inputClass, 'w-20')}
          value={item.estimatedWeightG}
          onChange={(e) => onUpdateWeight(item.id, Number(e.target.value))}
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
  onUpdateWeight,
  onUpdateNutrition,
  onRemove,
}: EditableProps) {
  if (!items.length) {
    return (
      <p className="px-2 py-4 text-sm text-ash-grey-500">
        Add an ingredient — pick Food DB to search the catalog, or Manual to type values.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-ash-grey-200">
            <th className={thClass}>Source</th>
            <th className={cn(thClass, 'min-w-[14rem]')}>Item</th>
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
              onUpdateWeight={onUpdateWeight}
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
