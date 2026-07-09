import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { MealImage } from '@/components/coach/MealImage';
import { Card, CardBody } from '@/components/ui/Card';
import { formatCoachPatientLabel, formatMealType, formatRelativeTime } from '@/lib/utils';
import type { CoachPastReviewItem } from '@/types';

export function PastReviewCard({ item }: { item: CoachPastReviewItem }) {
  const { meal, client, review } = item;
  const coachName = review.mealName ?? meal.mealName ?? 'Untitled meal';
  const aiName = meal.aiAnalysis?.mealName ?? meal.mealName;
  const coachNutrition = review.totalNutrition ?? meal.totalNutrition;
  const reviewedAt = review.reviewedAt;

  return (
    <Link to={`/coach/history/${meal.id}`}>
      <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-auto sm:w-40">
            <MealImage imageUrl={meal.imageUrl} alt={coachName} className="h-full w-full" />
          </div>

          <CardBody className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm text-ash-grey-500">
                  {formatCoachPatientLabel(client.patientId, client.profile.displayName)}
                </p>
                <h3 className="text-lg font-bold text-ash-grey-900">{coachName}</h3>
                {aiName && aiName !== coachName ? (
                  <p className="text-sm text-ash-grey-500">AI: {aiName}</p>
                ) : null}
              </div>
              <StatusBadge status={meal.status} />
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-ash-grey-600">
              <span>{formatMealType(meal.mealType)}</span>
              <span>·</span>
              <span>Reviewed {reviewedAt ? formatRelativeTime(reviewedAt) : '—'}</span>
            </div>

            {coachNutrition ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-spruce-50 px-3 py-1 text-sm font-semibold text-blue-spruce-800">
                  Coach: {coachNutrition.caloriesKcal} kcal
                </span>
                {meal.aiAnalysis?.totalNutrition &&
                meal.aiAnalysis.totalNutrition.caloriesKcal !== coachNutrition.caloriesKcal ? (
                  <span className="rounded-full bg-ash-grey-100 px-3 py-1 text-sm text-ash-grey-600">
                    AI: {meal.aiAnalysis.totalNutrition.caloriesKcal} kcal
                  </span>
                ) : null}
              </div>
            ) : null}

            {review.note ? (
              <p className="line-clamp-2 text-sm text-ash-grey-600">Note: {review.note}</p>
            ) : null}
          </CardBody>
        </div>
      </Card>
    </Link>
  );
}
