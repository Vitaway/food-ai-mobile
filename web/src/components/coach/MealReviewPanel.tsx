import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useCoachStore } from '@/stores/coachStore';
import type { CoachQueueItem } from '@/types';

export function MealReviewPanel({
  item,
  onApprove,
  onReject,
  isSubmitting,
}: {
  item: CoachQueueItem;
  onApprove: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}) {
  const draft = useCoachStore((s) => s.reviewDraft);
  const updateDraftItem = useCoachStore((s) => s.updateDraftItem);
  const updateDraftNote = useCoachStore((s) => s.updateDraftNote);
  const updateDraftMealName = useCoachStore((s) => s.updateDraftMealName);

  const { meal } = item;
  const items = draft?.items ?? meal.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        {meal.imageUrl ? (
          <img src={meal.imageUrl} alt={meal.mealName} className="max-h-80 w-full object-cover" />
        ) : null}
        <CardBody className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ash-grey-600">Meal name</label>
            <input
              className="w-full rounded-2xl border border-ash-grey-200 px-4 py-3 font-semibold outline-none focus:border-blue-spruce-400"
              value={draft?.mealName ?? meal.mealName ?? ''}
              onChange={(e) => updateDraftMealName(e.target.value)}
            />
          </div>

          {meal.note ? (
            <div className="rounded-2xl bg-blue-spruce-50 px-4 py-3 text-sm text-blue-spruce-800">
              Client note: {meal.note}
            </div>
          ) : null}

          {meal.plateDiameterCm ? (
            <p className="text-sm text-ash-grey-600">Plate diameter: {meal.plateDiameterCm} cm</p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Detected ingredients</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {items.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex flex-col gap-3 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-48">
                <span className="text-2xl">{ingredient.emoji ?? '🍽️'}</span>
                <div>
                  <p className="font-semibold">{ingredient.label}</p>
                  <p className="text-xs text-ash-grey-500">
                    {Math.round(ingredient.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <label className="text-sm text-ash-grey-500">Weight (g)</label>
                <input
                  type="number"
                  className="w-24 rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
                  value={ingredient.estimatedWeightG}
                  onChange={(e) =>
                    updateDraftItem(ingredient.id, { estimatedWeightG: Number(e.target.value) })
                  }
                />
              </div>
              <div className="text-sm text-ash-grey-600">
                {ingredient.nutrition.caloriesKcal} kcal · P {ingredient.nutrition.proteinG}g
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Coach note</h3>
        </CardHeader>
        <CardBody>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-ash-grey-200 px-4 py-3 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="Optional note for the client…"
            value={draft?.note ?? ''}
            onChange={(e) => updateDraftNote(e.target.value)}
          />
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" onClick={onApprove} disabled={isSubmitting}>
          Approve meal
        </Button>
        <Button variant="danger" size="lg" onClick={onReject} disabled={isSubmitting}>
          Reject
        </Button>
      </div>
    </div>
  );
}
