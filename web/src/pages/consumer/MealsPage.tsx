import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { CONSUMER_ROUTES } from '@/features/auth/constants';
import { useConsumerMeals } from '@/features/consumer/hooks/useConsumerQueries';

const statusTone: Record<string, string> = {
  approved: 'bg-shamrock-100 text-shamrock-800',
  in_review: 'bg-cinnamon-wood-100 text-cinnamon-wood-800',
  analyzing: 'bg-blue-spruce-100 text-blue-spruce-800',
  pending: 'bg-ash-grey-100 text-ash-grey-700',
  rejected: 'bg-red-100 text-red-800',
};

export function ConsumerMealsPage() {
  const { data: meals, isLoading } = useConsumerMeals();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">Meals</h2>
        <p className="mt-1 text-ash-grey-600">
          Meals synced from your mobile app. Approved meals count toward your daily totals.
        </p>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading meals…</p>
      ) : meals?.length ? (
        <div className="grid gap-3">
          {meals.map((meal) => (
            <Link key={meal.id} to={`${CONSUMER_ROUTES.meals}/${meal.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ash-grey-900">
                      {meal.mealName ?? meal.mealType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-ash-grey-500">
                      {new Date(meal.submittedAt).toLocaleString()}
                    </p>
                    {meal.coachReview?.note ? (
                      <p className="mt-2 text-sm text-blue-spruce-700">Coach: {meal.coachReview.note}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusTone[meal.status] ?? statusTone.pending}`}>
                      {meal.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-ash-grey-700">
                      {meal.totalNutrition?.caloriesKcal ?? '—'} kcal
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12 text-center text-ash-grey-500">No meals yet.</CardBody>
        </Card>
      )}
    </div>
  );
}
