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
  disabled = false,
}: {
  item: CoachMealDetail;
  onApprove: () => void;
  onApproveNext: () => void;
  onReject: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}) {
  const draft = useCoachStore((s) => s.reviewDraft);
  const updateDraftItemWeight = useCoachStore((s) => s.updateDraftItemWeight);
  const updateDraftItemNutrition = useCoachStore((s) => s.updateDraftItemNutrition);
  const updateDraftItem = useCoachStore((s) => s.updateDraftItem);
  const addDraftItem = useCoachStore((s) => s.addDraftItem);
  const removeDraftItem = useCoachStore((s) => s.removeDraftItem);
  const updateDraftTrainingNote = useCoachStore((s) => s.updateDraftTrainingNote);
  const updateDraftMealName = useCoachStore((s) => s.updateDraftMealName);
  const [showAi, setShowAi] = useState(true);

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
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,42%)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-3 xl:sticky xl:top-4">
          <MealPhotoViewer imageUrl={meal.imageUrl} alt={displayTitle} />

          <div className="rounded-xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-3 py-2.5 text-sm text-cinnamon-wood-900">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cinnamon-wood-600">
              Client description
            </p>
            {meal.textInput?.trim() ? (
              <p className="mt-1 whitespace-pre-wrap">{meal.textInput}</p>
            ) : (
              <p className="mt-1 text-cinnamon-wood-700/70">No description from the client.</p>
            )}
            {meal.note?.trim() ? (
              <p className="mt-2 border-t border-cinnamon-wood-200/80 pt-2 text-blue-spruce-800">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-spruce-600">
                  Client note
                </span>
                <span className="mt-0.5 block">{meal.note}</span>
              </p>
            ) : null}
            {meal.plateDiameterCm ? (
              <p className="mt-2 text-xs text-cinnamon-wood-700/80">
                Plate diameter: {meal.plateDiameterCm} cm
              </p>
            ) : null}
          </div>
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
                disabled={isSubmitting || disabled}>
                Approve meal
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRightIcon />}
                onClick={onApproveNext}
                disabled={isSubmitting || disabled}>
                Approve & next
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={<XIcon />}
                onClick={onReject}
                disabled={isSubmitting || disabled}>
                Reject
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {/* Full-width AI analysis — room for long item lists */}
      <DashboardPanel
        title="AI analysis"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {aiTotals ? (
              <div className="hidden flex-wrap gap-1 sm:flex">
                <StatusPill tone="muted">{aiTotals.caloriesKcal} kcal</StatusPill>
                <StatusPill tone="good">P {aiTotals.proteinG}g</StatusPill>
                <StatusPill tone="info">C {aiTotals.carbsG}g</StatusPill>
                <StatusPill tone="warn">F {aiTotals.fatG}g</StatusPill>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowAi((v) => !v)}
              className="text-xs font-semibold text-blue-spruce-600 hover:underline">
              {showAi ? 'Hide' : 'Show'} items
            </button>
          </div>
        }
        bodyClassName={showAi ? 'px-2 py-2 sm:px-3 sm:py-3' : 'px-3 py-2 sm:px-4 sm:py-2'}>
        {!showAi ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-ash-grey-600">
            <span>
              {aiItems.length} item{aiItems.length === 1 ? '' : 's'} detected
              {aiTotals ? ` · ${aiTotals.caloriesKcal} kcal` : ''}
            </span>
          </div>
        ) : (
          <div>
            <p className="mb-2 px-1 text-sm font-semibold text-ash-grey-800">
              {resolveCoachMealTitle({
                mealName: meal.mealName,
                aiMealName: meal.aiAnalysis?.mealName,
                mealType: meal.mealType,
              })}
              <span className="ml-2 font-normal text-ash-grey-500">
                · {aiItems.length} item{aiItems.length === 1 ? '' : 's'}
              </span>
            </p>
            <AiIngredientsTable items={aiItems} />
          </div>
        )}
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
  );
}
