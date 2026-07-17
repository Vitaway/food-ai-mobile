import type { DetectedFoodItem } from '@/types';
import { cn } from '@/lib/utils';

const thClass =
  'px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-ash-grey-500';
const tdClass = 'px-2.5 py-2 align-middle text-ash-grey-800';
const inputClass =
  'w-full min-w-0 rounded-md border border-ash-grey-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-spruce-400';

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

export function CoachIngredientsTable({
  items,
  onUpdateItem,
  onUpdateWeight,
  onUpdateNutrition,
  onRemove,
}: EditableProps) {
  if (!items.length) {
    return <p className="px-2 py-4 text-sm text-ash-grey-500">Add ingredients for your review.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-ash-grey-200">
            <th className={thClass}>Item</th>
            <th className={thClass}>Source</th>
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
            <tr key={item.id} className="border-b border-ash-grey-100 last:border-b-0">
              <td className={tdClass}>
                <input
                  className={cn(inputClass, 'min-w-[8rem] font-medium')}
                  value={item.label}
                  onChange={(e) => onUpdateItem(item.id, { label: e.target.value })}
                />
              </td>
              <td className={tdClass}>
                <select
                  className={cn(inputClass, 'w-auto')}
                  value={item.foodSource ?? 'manual'}
                  onChange={(e) =>
                    onUpdateItem(item.id, {
                      foodSource: e.target.value as DetectedFoodItem['foodSource'],
                    })
                  }>
                  <option value="ai">AI</option>
                  <option value="nutrition_db">Nutrition DB</option>
                  <option value="manual">Manual</option>
                </select>
              </td>
              <td className={tdClass}>
                <input
                  type="number"
                  className={cn(inputClass, 'w-20')}
                  value={item.estimatedWeightG}
                  onChange={(e) => onUpdateWeight(item.id, Number(e.target.value))}
                />
              </td>
              <td className={tdClass}>
                <input
                  type="number"
                  className={cn(inputClass, 'w-20')}
                  value={item.nutrition.caloriesKcal}
                  onChange={(e) =>
                    onUpdateNutrition(item.id, 'caloriesKcal', Number(e.target.value))
                  }
                />
              </td>
              <td className={tdClass}>
                <input
                  type="number"
                  className={cn(inputClass, 'w-16')}
                  value={item.nutrition.proteinG}
                  onChange={(e) => onUpdateNutrition(item.id, 'proteinG', Number(e.target.value))}
                />
              </td>
              <td className={tdClass}>
                <input
                  type="number"
                  className={cn(inputClass, 'w-16')}
                  value={item.nutrition.carbsG}
                  onChange={(e) => onUpdateNutrition(item.id, 'carbsG', Number(e.target.value))}
                />
              </td>
              <td className={tdClass}>
                <input
                  type="number"
                  className={cn(inputClass, 'w-16')}
                  value={item.nutrition.fatG}
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
