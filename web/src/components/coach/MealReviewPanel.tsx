import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ArrowRightIcon, CheckIcon, PlusIcon, XIcon } from '@/components/icons/ActionIcons';
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
    <div className="space-y-5">
      <DashboardPanel title={meal.mealName ?? 'Meal photo'} bodyClassName="px-0 py-0 sm:px-0 sm:py-0">
        <MealImage
          imageUrl={meal.imageUrl}
          alt={meal.mealName ?? 'Meal'}
          className="max-h-80 w-full rounded-none"
          imgClassName="max-h-80"
        />
        <div className="space-y-3 px-4 py-4 sm:px-5">
          {meal.textInput ? (
            <div className="rounded-xl bg-cinnamon-wood-50 px-3 py-2.5 text-sm text-cinnamon-wood-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cinnamon-wood-600">
                Client description
              </p>
              <p className="mt-1">{meal.textInput}</p>
            </div>
          ) : null}
          {meal.note ? (
            <div className="rounded-xl bg-blue-spruce-50 px-3 py-2.5 text-sm text-blue-spruce-800">
              Client note: {meal.note}
            </div>
          ) : null}
          {meal.plateDiameterCm ? (
            <p className="text-sm text-ash-grey-600">Plate diameter: {meal.plateDiameterCm} cm</p>
          ) : null}
        </div>
      </DashboardPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanel
          title="AI analysis (read-only)"
          action={
            aiTotals ? (
              <div className="flex flex-wrap gap-1">
                <StatusPill tone="muted">{aiTotals.caloriesKcal} kcal</StatusPill>
                <StatusPill tone="good">P {aiTotals.proteinG}g</StatusPill>
                <StatusPill tone="info">C {aiTotals.carbsG}g</StatusPill>
                <StatusPill tone="warn">F {aiTotals.fatG}g</StatusPill>
              </div>
            ) : null
          }>
          <div className="px-2 pb-2 pt-1">
            <p className="mb-2 px-1 text-sm font-semibold text-ash-grey-800">
              {meal.aiAnalysis?.mealName ?? meal.mealName ?? 'Untitled'}
            </p>
            <AiIngredientsTable items={aiItems} />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Your review"
          action={
            coachTotals ? (
              <StatusPill tone="info">{coachTotals.caloriesKcal} kcal coach total</StatusPill>
            ) : null
          }>
          <div className="space-y-3 px-2 pb-3 pt-1">
            <div className="px-1">
              <label className="mb-1 block text-xs font-semibold text-ash-grey-500">Meal name</label>
              <input
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-spruce-400"
                value={draft?.mealName ?? ''}
                onChange={(e) => updateDraftMealName(e.target.value)}
              />
            </div>

            {coachTotals ? (
              <div className="mx-1 flex flex-wrap gap-2 rounded-xl bg-blue-spruce-50 px-3 py-2 text-sm text-blue-spruce-900">
                <span className="font-semibold">{coachTotals.caloriesKcal} kcal</span>
                <span>P {coachTotals.proteinG}g</span>
                <span>C {coachTotals.carbsG}g</span>
                <span>F {coachTotals.fatG}g</span>
              </div>
            ) : null}

            <CoachIngredientsTable
              items={coachItems}
              onUpdateItem={updateDraftItem}
              onUpdateWeight={updateDraftItemWeight}
              onUpdateNutrition={updateDraftItemNutrition}
              onRemove={removeDraftItem}
            />

            <div className="px-1">
              <Button type="button" variant="outline" size="sm" icon={<PlusIcon />} onClick={addDraftItem}>
                Add ingredient
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Coach note">
        <div className="px-3 py-2">
          <p className="mb-2 text-xs text-ash-grey-500">Visible to the client when you approve</p>
          <textarea
            className="min-h-24 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="Optional note for the client…"
            value={draft?.note ?? ''}
            onChange={(e) => updateDraftNote(e.target.value)}
          />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Training note">
        <div className="px-3 py-2">
          <p className="mb-2 text-xs text-ash-grey-500">Internal only — used for model improvement</p>
          <textarea
            className="min-h-20 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="What did the AI get wrong? Any labeling guidance…"
            value={draft?.trainingNote ?? ''}
            onChange={(e) => updateDraftTrainingNote(e.target.value)}
          />
        </div>
      </DashboardPanel>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          icon={<CheckIcon />}
          onClick={onApprove}
          disabled={isSubmitting}>
          Approve meal
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={<ArrowRightIcon />}
          onClick={onApproveNext}
          disabled={isSubmitting}>
          Approve & next
        </Button>
        <Button
          variant="danger"
          size="md"
          icon={<XIcon />}
          onClick={onReject}
          disabled={isSubmitting}>
          Reject
        </Button>
      </div>
    </div>
  );
}
