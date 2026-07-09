import type { DetectedFoodItem } from '@/types';

export function AiIngredientsTable({ items }: { items: DetectedFoodItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-ash-grey-500">No ingredients detected.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ash-grey-100">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-ash-grey-100 bg-ash-grey-50 text-xs uppercase tracking-wide text-ash-grey-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Serving</th>
            <th className="px-3 py-2 font-semibold">Weight</th>
            <th className="px-3 py-2 font-semibold">Kcal</th>
            <th className="px-3 py-2 font-semibold">Protein</th>
            <th className="px-3 py-2 font-semibold">Carbs</th>
            <th className="px-3 py-2 font-semibold">Fat</th>
            <th className="px-3 py-2 font-semibold">Conf.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-ash-grey-50 last:border-0">
              <td className="px-3 py-2 font-medium text-ash-grey-900">
                <span className="mr-2">{item.emoji ?? '🍽️'}</span>
                {item.label}
              </td>
              <td className="px-3 py-2 text-ash-grey-700">
                {item.servingUnit
                  ? `${item.servingAmount ?? 1} ${item.servingUnit}`
                  : '—'}
              </td>
              <td className="px-3 py-2 text-ash-grey-700">{item.estimatedWeightG}g</td>
              <td className="px-3 py-2">{item.nutrition.caloriesKcal}</td>
              <td className="px-3 py-2">{item.nutrition.proteinG}g</td>
              <td className="px-3 py-2">{item.nutrition.carbsG}g</td>
              <td className="px-3 py-2">{item.nutrition.fatG}g</td>
              <td className="px-3 py-2 text-ash-grey-500">{Math.round(item.confidence * 100)}%</td>
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
    return <p className="text-sm text-ash-grey-500">Add ingredients for your review.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-blue-spruce-100">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-blue-spruce-100 bg-blue-spruce-50 text-xs uppercase tracking-wide text-blue-spruce-700">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Weight (g)</th>
            <th className="px-3 py-2 font-semibold">Kcal</th>
            <th className="px-3 py-2 font-semibold">Protein</th>
            <th className="px-3 py-2 font-semibold">Carbs</th>
            <th className="px-3 py-2 font-semibold">Fat</th>
            <th className="px-3 py-2 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-ash-grey-50 last:border-0">
              <td className="px-3 py-2">
                <input
                  className="w-full min-w-[8rem] rounded-lg border border-ash-grey-200 px-2 py-1 font-medium"
                  value={item.label}
                  onChange={(e) => onUpdateItem(item.id, { label: e.target.value })}
                />
              </td>
              <td className="px-3 py-2">
                <select
                  className="rounded-lg border border-ash-grey-200 px-2 py-1 text-xs"
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
              <td className="px-3 py-2">
                <input
                  type="number"
                  className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1"
                  value={item.estimatedWeightG}
                  onChange={(e) => onUpdateWeight(item.id, Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1"
                  value={item.nutrition.caloriesKcal}
                  onChange={(e) => onUpdateNutrition(item.id, 'caloriesKcal', Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1"
                  value={item.nutrition.proteinG}
                  onChange={(e) => onUpdateNutrition(item.id, 'proteinG', Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1"
                  value={item.nutrition.carbsG}
                  onChange={(e) => onUpdateNutrition(item.id, 'carbsG', Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1"
                  value={item.nutrition.fatG}
                  onChange={(e) => onUpdateNutrition(item.id, 'fatG', Number(e.target.value))}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-xs font-medium text-red-600 hover:underline"
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-ash-grey-100">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-ash-grey-100 bg-ash-grey-50 text-xs uppercase tracking-wide text-ash-grey-500">
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Serving</th>
            <th className="px-3 py-2 font-semibold">Weight</th>
            <th className="px-3 py-2 font-semibold">Kcal</th>
            <th className="px-3 py-2 font-semibold">Protein</th>
            <th className="px-3 py-2 font-semibold">Carbs</th>
            <th className="px-3 py-2 font-semibold">Fat</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-ash-grey-50 last:border-0">
              <td className="px-3 py-2 font-medium">
                <span className="mr-2">{item.emoji ?? '🍽️'}</span>
                {item.label}
              </td>
              <td className="px-3 py-2 text-ash-grey-700">
                {item.servingUnit ? `${item.servingAmount ?? 1} ${item.servingUnit}` : '—'}
              </td>
              <td className="px-3 py-2">{item.estimatedWeightG}g</td>
              <td className="px-3 py-2">{item.nutrition.caloriesKcal}</td>
              <td className="px-3 py-2">{item.nutrition.proteinG}g</td>
              <td className="px-3 py-2">{item.nutrition.carbsG}g</td>
              <td className="px-3 py-2">{item.nutrition.fatG}g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
