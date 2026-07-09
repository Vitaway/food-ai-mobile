import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { AiIngredientsTable, CoachIngredientsTable } from '@/components/coach/IngredientTables';
import { MealImage } from '@/components/coach/MealImage';
import { sumNutrition } from '@/lib/nutrition';
import { useCoachStore } from '@/stores/coachStore';
import type { CoachMealDetail } from '@/types';

export function MealReviewPanel({
  item,
  onApprove,
  onApproveNext,
  onReject,
  isSubmitting,
}: {
  item: CoachMealDetail;
  onApprove: () => void;
  onApproveNext: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}) {
  const draft = useCoachStore((s) => s.reviewDraft);
  const updateDraftItemWeight = useCoachStore((s) => s.updateDraftItemWeight);
  const updateDraftItemNutrition = useCoachStore((s) => s.updateDraftItemNutrition);
  const updateDraftItem = useCoachStore((s) => s.updateDraftItem);
  const addDraftItem = useCoachStore((s) => s.addDraftItem);
  const removeDraftItem = useCoachStore((s) => s.removeDraftItem);
  const updateDraftNote = useCoachStore((s) => s.updateDraftNote);
  const updateDraftTrainingNote = useCoachStore((s) => s.updateDraftTrainingNote);
  const updateDraftMealName = useCoachStore((s) => s.updateDraftMealName);

  const { meal } = item;
  const aiItems = meal.aiAnalysis?.items ?? meal.items ?? [];
  const aiTotals = meal.aiAnalysis?.totalNutrition ?? (aiItems.length ? sumNutrition(aiItems) : null);
  const coachItems = draft?.items ?? [];
  const coachTotals = coachItems.length ? sumNutrition(coachItems) : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <MealImage
          imageUrl={meal.imageUrl}
          alt={meal.mealName ?? 'Meal'}
          className="max-h-80 w-full"
          imgClassName="max-h-80"
        />
        <CardBody className="space-y-3">
          {meal.textInput ? (
            <div className="rounded-2xl bg-cinnamon-wood-50 px-4 py-3 text-sm text-cinnamon-wood-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-cinnamon-wood-600">
                Client description
              </p>
              <p className="mt-1">{meal.textInput}</p>
            </div>
          ) : null}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-ash-grey-900">AI analysis (read-only)</h3>
            <p className="text-sm text-ash-grey-500">Original submission — never edited</p>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="font-semibold text-ash-grey-800">{meal.aiAnalysis?.mealName ?? meal.mealName ?? 'Untitled'}</p>
            {aiTotals ? (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-ash-grey-100 px-3 py-1 font-semibold">
                  {aiTotals.caloriesKcal} kcal
                </span>
                <span className="rounded-full bg-shamrock-50 px-3 py-1">P {aiTotals.proteinG}g</span>
                <span className="rounded-full bg-blue-spruce-50 px-3 py-1">C {aiTotals.carbsG}g</span>
                <span className="rounded-full bg-cinnamon-wood-50 px-3 py-1">F {aiTotals.fatG}g</span>
              </div>
            ) : null}
            <AiIngredientsTable items={aiItems} />
          </CardBody>
        </Card>

        <Card className="border-blue-spruce-200 ring-1 ring-blue-spruce-100">
          <CardHeader>
            <h3 className="font-bold text-blue-spruce-800">Your review</h3>
            <p className="text-sm text-ash-grey-500">Saved separately when you approve or reject</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ash-grey-600">Meal name</label>
              <input
                className="w-full rounded-2xl border border-ash-grey-200 px-4 py-3 font-semibold outline-none focus:border-blue-spruce-400"
                value={draft?.mealName ?? ''}
                onChange={(e) => updateDraftMealName(e.target.value)}
              />
            </div>

            {coachTotals ? (
              <div className="rounded-2xl bg-blue-spruce-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-spruce-600">
                  Coach totals
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="font-bold text-blue-spruce-800">{coachTotals.caloriesKcal} kcal</span>
                  <span>P {coachTotals.proteinG}g</span>
                  <span>C {coachTotals.carbsG}g</span>
                  <span>F {coachTotals.fatG}g</span>
                </div>
              </div>
            ) : null}

            <CoachIngredientsTable
              items={coachItems}
              onUpdateItem={updateDraftItem}
              onUpdateWeight={updateDraftItemWeight}
              onUpdateNutrition={updateDraftItemNutrition}
              onRemove={removeDraftItem}
            />

            <Button type="button" variant="secondary" size="sm" onClick={addDraftItem}>
              + Add ingredient
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Coach note</h3>
          <p className="text-sm text-ash-grey-500">Visible to the client when you approve</p>
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

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Training note</h3>
          <p className="text-sm text-ash-grey-500">Internal only — used for model improvement</p>
        </CardHeader>
        <CardBody>
          <textarea
            className="min-h-20 w-full rounded-2xl border border-ash-grey-200 px-4 py-3 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="What did the AI get wrong? Any labeling guidance…"
            value={draft?.trainingNote ?? ''}
            onChange={(e) => updateDraftTrainingNote(e.target.value)}
          />
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="lg" onClick={onApprove} disabled={isSubmitting}>
          Approve meal
        </Button>
        <Button variant="primary" size="lg" onClick={onApproveNext} disabled={isSubmitting}>
          Approve & next →
        </Button>
        <Button variant="danger" size="lg" onClick={onReject} disabled={isSubmitting}>
          Reject
        </Button>
      </div>
    </div>
  );
}
