import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ArrowRightIcon, CheckIcon, PlusIcon, XIcon } from '@/components/icons/ActionIcons';
import { AiIngredientsTable, CoachIngredientsTable } from '@/components/coach/IngredientTables';
import { MealPhotoViewer } from '@/components/coach/MealPhotoViewer';
import { sumNutrition } from '@/lib/nutrition';
import { isUsableMealName, resolveCoachMealTitle } from '@/lib/utils';
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
  const [showAi, setShowAi] = useState(false);

  const { meal } = item;
  const displayTitle = resolveCoachMealTitle({
    mealName: draft?.mealName || meal.mealName,
    aiMealName: meal.aiAnalysis?.mealName,
    mealType: meal.mealType,
  });
  const aiItems = meal.aiAnalysis?.items ?? meal.items ?? [];
  const aiTotals = meal.aiAnalysis?.totalNutrition ?? (aiItems.length ? sumNutrition(aiItems) : null);
  const coachItems = draft?.items ?? [];
  const coachTotals = coachItems.length ? sumNutrition(coachItems) : null;

  return (
    <div className="space-y-4">
      {/* Primary workspace: photo left, coach review right */}
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,38%)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-3 xl:sticky xl:top-4">
          <MealPhotoViewer imageUrl={meal.imageUrl} alt={displayTitle} />
          {meal.textInput ? (
            <div className="rounded-xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-3 py-2.5 text-sm text-cinnamon-wood-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cinnamon-wood-600">
                Client description
              </p>
              <p className="mt-1">{meal.textInput}</p>
            </div>
          ) : null}
          {meal.note ? (
            <div className="rounded-xl border border-blue-spruce-200 bg-blue-spruce-50 px-3 py-2.5 text-sm text-blue-spruce-800">
              Client note: {meal.note}
            </div>
          ) : null}
          {meal.plateDiameterCm ? (
            <p className="text-xs text-ash-grey-500">Plate diameter: {meal.plateDiameterCm} cm</p>
          ) : null}
        </div>

        <DashboardPanel
          title="Your review"
          action={
            coachTotals ? (
              <div className="flex flex-wrap gap-1">
                <StatusPill tone="muted">{coachTotals.caloriesKcal} kcal</StatusPill>
                <StatusPill tone="good">P {coachTotals.proteinG}g</StatusPill>
                <StatusPill tone="info">C {coachTotals.carbsG}g</StatusPill>
                <StatusPill tone="warn">F {coachTotals.fatG}g</StatusPill>
              </div>
            ) : null
          }
          bodyClassName="px-3 py-3 sm:px-4 sm:py-3">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ash-grey-500">Meal name</label>
              <input
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-spruce-400"
                value={draft?.mealName ?? ''}
                placeholder={displayTitle}
                onChange={(e) => updateDraftMealName(e.target.value)}
                onBlur={() => {
                  if (!isUsableMealName(draft?.mealName)) {
                    updateDraftMealName(displayTitle);
                  }
                }}
              />
            </div>

            <CoachIngredientsTable
              items={coachItems}
              onUpdateItem={updateDraftItem}
              onUpdateWeight={updateDraftItemWeight}
              onUpdateNutrition={updateDraftItemNutrition}
              onRemove={removeDraftItem}
            />

            <Button type="button" variant="outline" size="sm" icon={<PlusIcon />} onClick={addDraftItem}>
              Add ingredient
            </Button>

            <div className="flex flex-wrap gap-2 border-t border-ash-grey-100 pt-3">
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
        </DashboardPanel>
      </div>

      {/* AI analysis — secondary, collapsed by default so review stays above the fold */}
      <DashboardPanel
        title="AI analysis"
        action={
          <button
            type="button"
            onClick={() => setShowAi((v) => !v)}
            className="text-xs font-semibold text-blue-spruce-600 hover:underline">
            {showAi ? 'Hide' : 'Show'} read-only AI items
          </button>
        }
        bodyClassName={showAi ? 'px-2 py-2 sm:px-3 sm:py-2' : 'px-3 py-2 sm:px-4 sm:py-2'}>
        {!showAi ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-ash-grey-600">
            <span>
              {aiItems.length} item{aiItems.length === 1 ? '' : 's'} detected
              {aiTotals ? ` · ${aiTotals.caloriesKcal} kcal` : ''}
            </span>
            {aiTotals ? (
              <>
                <StatusPill tone="good">P {aiTotals.proteinG}g</StatusPill>
                <StatusPill tone="info">C {aiTotals.carbsG}g</StatusPill>
                <StatusPill tone="warn">F {aiTotals.fatG}g</StatusPill>
              </>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="mb-2 px-1 text-sm font-semibold text-ash-grey-800">
              {resolveCoachMealTitle({
                mealName: meal.mealName,
                aiMealName: meal.aiAnalysis?.mealName,
                mealType: meal.mealType,
              })}
            </p>
            <AiIngredientsTable items={aiItems} />
          </div>
        )}
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Coach note" bodyClassName="px-3 py-2 sm:px-4 sm:py-3">
          <p className="mb-2 text-xs text-ash-grey-500">Visible to the client when you approve</p>
          <textarea
            className="min-h-20 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="Optional note for the client…"
            value={draft?.note ?? ''}
            onChange={(e) => updateDraftNote(e.target.value)}
          />
        </DashboardPanel>
        <DashboardPanel title="Training note" bodyClassName="px-3 py-2 sm:px-4 sm:py-3">
          <p className="mb-2 text-xs text-ash-grey-500">Internal only — used for model improvement</p>
          <textarea
            className="min-h-20 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="What did the AI get wrong? Any labeling guidance…"
            value={draft?.trainingNote ?? ''}
            onChange={(e) => updateDraftTrainingNote(e.target.value)}
          />
        </DashboardPanel>
      </div>
    </div>
  );
}
