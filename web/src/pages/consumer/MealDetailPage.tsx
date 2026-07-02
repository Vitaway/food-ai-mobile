import { Link, useParams } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { CONSUMER_ROUTES } from '@/features/auth/constants';
import { useConsumerMeal } from '@/features/consumer/hooks/useConsumerQueries';

export function ConsumerMealDetailPage() {
  const { id = '' } = useParams();
  const { data: meal, isLoading } = useConsumerMeal(id);

  if (isLoading) {
    return <p className="text-ash-grey-500">Loading meal…</p>;
  }

  if (!meal) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <p className="text-ash-grey-500">Meal not found.</p>
          <Link to={CONSUMER_ROUTES.meals} className="mt-4 inline-block text-blue-spruce-600 hover:underline">
            Back to meals
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={CONSUMER_ROUTES.meals} className="text-sm text-blue-spruce-600 hover:underline">
        ← Back to meals
      </Link>

      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">
          {meal.mealName ?? meal.mealType.replace(/_/g, ' ')}
        </h2>
        <p className="mt-1 capitalize text-ash-grey-600">
          {meal.status.replace(/_/g, ' ')} · {new Date(meal.submittedAt).toLocaleString()}
        </p>
      </div>

      {meal.coachReview?.note ? (
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-blue-spruce-800">Coach note</p>
            <p className="mt-2 text-ash-grey-700">{meal.coachReview.note}</p>
          </CardBody>
        </Card>
      ) : null}

      {meal.items?.length ? (
        <Card>
          <CardBody className="space-y-3">
            <p className="font-semibold text-ash-grey-900">Items</p>
            {meal.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-ash-grey-600">{item.nutrition.caloriesKcal} kcal</span>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {meal.totalNutrition ? (
        <Card>
          <CardBody>
            <p className="font-semibold text-ash-grey-900">Totals</p>
            <p className="mt-2 text-ash-grey-700">
              {meal.totalNutrition.caloriesKcal} kcal · P {meal.totalNutrition.proteinG}g · C{' '}
              {meal.totalNutrition.carbsG}g · F {meal.totalNutrition.fatG}g
            </p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
