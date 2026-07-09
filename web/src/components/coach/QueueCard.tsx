import { Link } from 'react-router-dom';
import { FlagBadge, StatusBadge } from '@/components/ui/Badge';
import { MealImage } from '@/components/coach/MealImage';
import { Card, CardBody } from '@/components/ui/Card';
import { formatMealType, formatRelativeTime, formatCoachPatientLabel, cn } from '@/lib/utils';
import type { CoachQueueItem } from '@/types';
import { HEALTH_FLAG_STYLES } from '@/constants/mealStatus';

export function QueueCard({ item }: { item: CoachQueueItem }) {
  const { meal, client } = item;
  const flagged = meal.fraudCheckResult === 'flag';
  const lowConfidence = (meal.confidenceAvg ?? 1) < 0.8;
  const allergies = client.profile.allergies ?? [];
  const hasAllergies = meal.hasAllergies || allergies.length > 0;

  return (
    <Link to={`/coach/queue/${meal.id}`}>
      <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
            <MealImage
              imageUrl={meal.imageUrl}
              alt={meal.mealName ?? 'Meal'}
              className="h-full w-full"
            />
            {meal.healthFlag ? (
              <span
                className={cn(
                  'absolute left-3 top-3 rounded-full px-2 py-1 text-xs font-semibold',
                  HEALTH_FLAG_STYLES[meal.healthFlag],
                )}>
                {meal.healthFlag}
              </span>
            ) : null}
          </div>

          <CardBody className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm text-ash-grey-500">
                  {formatCoachPatientLabel(client.patientId ?? meal.clientId, client.profile.displayName)}
                </p>
                <h3 className="text-lg font-bold text-ash-grey-900">{meal.mealName ?? 'Untitled meal'}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={meal.status} />
                <FlagBadge flagged={flagged} />
                {meal.classificationLabel ? (
                  <span className="rounded-full bg-ash-grey-100 px-2.5 py-1 text-xs font-semibold text-ash-grey-700">
                    {meal.classificationLabel}
                  </span>
                ) : null}
                {meal.complexity ? (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                      meal.complexity === 'high'
                        ? 'bg-red-50 text-red-700'
                        : meal.complexity === 'medium'
                          ? 'bg-cinnamon-wood-50 text-cinnamon-wood-700'
                          : 'bg-ash-grey-100 text-ash-grey-600',
                    )}>
                    {meal.complexity}
                  </span>
                ) : null}
                {hasAllergies ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    Allergies
                  </span>
                ) : null}
                {meal.manualReviewRequired ? (
                  <span className="rounded-full bg-cinnamon-wood-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cinnamon-wood-700">
                    {meal.manualReviewReason === 'ai_unavailable' ? 'AI unavailable' : 'Manual review'}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-ash-grey-600">
              <span>{formatMealType(meal.mealType)}</span>
              <span>·</span>
              <span>{formatRelativeTime(meal.submittedAt)}</span>
              {meal.confidenceAvg ? (
                <>
                  <span>·</span>
                  <span className={lowConfidence ? 'font-semibold text-cinnamon-wood-600' : ''}>
                    {Math.round(meal.confidenceAvg * 100)}% confidence
                  </span>
                </>
              ) : null}
              {meal.slaMinutesRemaining != null && meal.slaMinutesRemaining <= 120 ? (
                <>
                  <span>·</span>
                  <span
                    className={
                      meal.slaLevel === 'critical'
                        ? 'font-semibold text-red-600'
                        : 'font-semibold text-cinnamon-wood-600'
                    }>
                    {meal.slaMinutesRemaining <= 0
                      ? 'SLA breached'
                      : `${meal.slaMinutesRemaining}m to SLA`}
                  </span>
                </>
              ) : meal.waitingMinutes != null && meal.waitingMinutes >= 60 ? (
                <>
                  <span>·</span>
                  <span
                    className={
                      meal.slaLevel === 'critical'
                        ? 'font-semibold text-red-600'
                        : 'font-semibold text-cinnamon-wood-600'
                    }>
                    Waiting {meal.waitingMinutes}m
                  </span>
                </>
              ) : null}
            </div>

            {meal.totalNutrition ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-ash-grey-100 px-3 py-1 text-sm font-semibold">
                  {meal.totalNutrition.caloriesKcal} kcal
                </span>
                <span className="rounded-full bg-shamrock-50 px-3 py-1 text-sm text-shamrock-800">
                  P {meal.totalNutrition.proteinG}g
                </span>
                <span className="rounded-full bg-blue-spruce-50 px-3 py-1 text-sm text-blue-spruce-800">
                  C {meal.totalNutrition.carbsG}g
                </span>
              </div>
            ) : null}

            {meal.healthMessage ? (
              <p className="text-sm text-ash-grey-600">{meal.healthMessage}</p>
            ) : null}
          </CardBody>
        </div>
      </Card>
    </Link>
  );
}
