import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { MealImage } from '@/components/coach/MealImage';
import { ReadOnlyIngredientsTable } from '@/components/coach/IngredientTables';
import { sumNutrition } from '@/lib/nutrition';
import type { CoachMealDetail } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export function PastReviewDetailPanel({ item }: { item: CoachMealDetail }) {
  const { meal, reviewHistory } = item;
  const review = reviewHistory[0] ?? meal.coachReview;
  const aiItems = meal.aiAnalysis?.items ?? [];
  const coachItems = review?.items ?? meal.items ?? [];
  const aiTotals =
    meal.aiAnalysis?.totalNutrition ?? (aiItems.length ? sumNutrition(aiItems) : null);
  const coachTotals =
    review?.totalNutrition ?? (coachItems.length ? sumNutrition(coachItems) : null);

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
            <div className="rounded-2xl bg-cinnamon-wood-50 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase text-cinnamon-wood-600">Client description</p>
              <p className="mt-1">{meal.textInput}</p>
            </div>
          ) : null}
          {review?.reviewedAt ? (
            <p className="text-sm text-ash-grey-600">
              Reviewed {formatRelativeTime(review.reviewedAt)}
              {review.reviewDurationSeconds
                ? ` · ${Math.round(review.reviewDurationSeconds / 60)}m after submission`
                : ''}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-bold">AI analysis (original)</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="font-semibold">{meal.aiAnalysis?.mealName ?? meal.mealName ?? '—'}</p>
            {aiTotals ? (
              <p className="text-sm text-ash-grey-600">
                {aiTotals.caloriesKcal} kcal · P {aiTotals.proteinG}g · C {aiTotals.carbsG}g · F{' '}
                {aiTotals.fatG}g
              </p>
            ) : null}
            <ReadOnlyIngredientsTable items={aiItems} />
          </CardBody>
        </Card>

        <Card className="border-blue-spruce-200">
          <CardHeader>
            <h3 className="font-bold text-blue-spruce-800">Coach review (saved)</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="font-semibold">{review?.mealName ?? meal.mealName ?? '—'}</p>
            {coachTotals ? (
              <p className="text-sm font-medium text-blue-spruce-800">
                {coachTotals.caloriesKcal} kcal · P {coachTotals.proteinG}g · C {coachTotals.carbsG}g · F{' '}
                {coachTotals.fatG}g
              </p>
            ) : null}
            <ReadOnlyIngredientsTable items={coachItems} />
            {review?.note ? (
              <div className="rounded-2xl bg-blue-spruce-50 px-4 py-3 text-sm text-blue-spruce-900">
                Coach note: {review.note}
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
