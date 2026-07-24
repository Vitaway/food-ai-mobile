import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { ArrowRightIcon, CheckIcon, PlusIcon, XIcon } from '@/components/icons/ActionIcons';
import { CoachIngredientsTable } from '@/components/coach/IngredientTables';
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
  onAiAssist,
  isSubmitting,
  isAiAssisting = false,
  disabled = false,
  isUpdate = false,
}: {
  item: CoachMealDetail;
  onApprove: () => void;
  onApproveNext: () => void;
  onReject: () => void;
  onAiAssist?: () => void;
  isSubmitting: boolean;
  isAiAssisting?: boolean;
  disabled?: boolean;
  isUpdate?: boolean;
}) {
  const draft = useCoachStore((s) => s.reviewDraft);
  const updateDraftItemWeight = useCoachStore((s) => s.updateDraftItemWeight);
  const updateDraftItemNutrition = useCoachStore((s) => s.updateDraftItemNutrition);
  const updateDraftItem = useCoachStore((s) => s.updateDraftItem);
  const addDraftItem = useCoachStore((s) => s.addDraftItem);
  const removeDraftItem = useCoachStore((s) => s.removeDraftItem);
  const updateDraftTrainingNote = useCoachStore((s) => s.updateDraftTrainingNote);
  const updateDraftMealName = useCoachStore((s) => s.updateDraftMealName);

  const { meal } = item;
  const displayTitle = resolveCoachMealTitle({
    mealName: draft?.mealName || meal.mealName,
    mealType: meal.mealType,
  });
  const coachItems = draft?.items ?? [];
  const coachTotals = coachItems.length ? sumNutrition(coachItems) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,42%)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-3 xl:sticky xl:top-4">
          <MealPhotoViewer imageUrl={meal.imageUrl} alt={displayTitle} />

          {onAiAssist ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={onAiAssist}
              disabled={isSubmitting || isAiAssisting || disabled}>
              {isAiAssisting ? 'Asking AI…' : 'Ask AI suggestion'}
            </Button>
          ) : null}

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
                {isUpdate ? 'Update approval' : 'Approve meal'}
              </Button>
              {!isUpdate ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRightIcon />}
                  onClick={onApproveNext}
                  disabled={isSubmitting || disabled}>
                  Approve & next
                </Button>
              ) : null}
              <Button
                variant="danger"
                size="md"
                icon={<XIcon />}
                onClick={onReject}
                disabled={isSubmitting || disabled}>
                {isUpdate ? 'Update as rejected' : 'Reject'}
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Training note" bodyClassName="px-3 py-2 sm:px-4 sm:py-3">
        <p className="mb-2 text-xs text-ash-grey-500">Internal only — used for model improvement</p>
        <textarea
          className="min-h-20 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
          placeholder="What should improve next time? Labeling notes…"
          value={draft?.trainingNote ?? ''}
          onChange={(e) => updateDraftTrainingNote(e.target.value)}
        />
      </DashboardPanel>
    </div>
  );
}
