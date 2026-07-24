import { useState } from 'react';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { AiIngredientsTable, ReadOnlyIngredientsTable } from '@/components/coach/IngredientTables';
import { MealPhotoViewer } from '@/components/coach/MealPhotoViewer';
import { sumNutrition } from '@/lib/nutrition';
import { formatRelativeTime, resolveCoachMealTitle } from '@/lib/utils';
import type { CoachMealDetail } from '@/types';

export function PastReviewDetailPanel({ item }: { item: CoachMealDetail }) {
  const { meal, reviewHistory } = item;
  const review = reviewHistory[0] ?? meal.coachReview;
  const [showAi, setShowAi] = useState(true);

  const displayTitle = resolveCoachMealTitle({
    mealName: review?.mealName || meal.mealName,
    aiMealName: meal.aiAnalysis?.mealName,
    mealType: meal.mealType,
  });

  const aiItems = meal.aiAnalysis?.items ?? [];
  const coachItems = review?.items ?? meal.items ?? [];
  const aiTotals =
    meal.aiAnalysis?.totalNutrition ?? (aiItems.length ? sumNutrition(aiItems) : null);
  const coachTotals =
    review?.totalNutrition ?? (coachItems.length ? sumNutrition(coachItems) : null);

  const reviewedMeta = review?.reviewedAt
    ? `Reviewed ${formatRelativeTime(review.reviewedAt)}${
        review.reviewDurationSeconds
          ? ` · ${Math.round(review.reviewDurationSeconds / 60)}m after submission`
          : ''
      }`
    : null;

  return (
    <div className="space-y-4">
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
            {reviewedMeta ? (
              <p className="mt-2 text-xs text-cinnamon-wood-700/70">{reviewedMeta}</p>
            ) : null}
          </div>
        </div>

        <DashboardPanel
          title="Coach review"
          className="border-blue-spruce-200"
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
              <p className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Meal name</p>
              <p className="mt-1 text-sm font-semibold text-ash-grey-900">{displayTitle}</p>
            </div>

            <ReadOnlyIngredientsTable items={coachItems} />

            {review?.action ? (
              <div className="flex flex-wrap gap-2 border-t border-ash-grey-100 pt-3">
                <StatusPill tone={review.action === 'approve' ? 'good' : 'bad'}>
                  {review.action === 'approve' ? 'Approved' : 'Rejected'}
                </StatusPill>
                {reviewedMeta ? (
                  <span className="self-center text-xs text-ash-grey-500">{reviewedMeta}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </DashboardPanel>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Coach note" bodyClassName="px-3 py-2 sm:px-4 sm:py-3">
          <p className="mb-1 text-xs text-ash-grey-500">Visible to the client</p>
          {review?.note?.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-ash-grey-800">{review.note}</p>
          ) : (
            <p className="text-sm text-ash-grey-500">No coach note was saved.</p>
          )}
        </DashboardPanel>
        <DashboardPanel title="Training note" bodyClassName="px-3 py-2 sm:px-4 sm:py-3">
          <p className="mb-1 text-xs text-ash-grey-500">Internal only</p>
          {review?.trainingNote?.trim() ? (
            <p className="whitespace-pre-wrap text-sm text-ash-grey-800">{review.trainingNote}</p>
          ) : (
            <p className="text-sm text-ash-grey-500">No training note was saved.</p>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
