import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { CONSUMER_ROUTES } from '@/features/auth/constants';
import { useAuth } from '@/features/auth';
import {
  useConsumerDashboard,
  useConsumerMeals,
} from '@/features/consumer/hooks/useConsumerQueries';

export function ConsumerOverviewPage() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useConsumerDashboard();
  const { data: meals } = useConsumerMeals();

  const recentMeals = meals?.slice(0, 5) ?? [];
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-spruce-700 via-blue-spruce-600 to-blue-spruce-500 p-6 text-white shadow-lg sm:p-8">
        <p className="text-white/80">Welcome back, {firstName}</p>
        <h2 className="mt-1 text-3xl tracking-tight">Your day</h2>
        {user?.patientId ? (
          <p className="mt-2 text-sm text-white/75">Patient file · {user.patientId}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading dashboard…</p>
      ) : dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-sm text-ash-grey-500">Calories</p>
              <p className="mt-1 text-2xl font-bold text-ash-grey-900">
                {dashboard.caloriesConsumed}
                <span className="text-base font-normal text-ash-grey-500">
                  {' '}
                  / {dashboard.calorieTarget}
                </span>
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-ash-grey-500">Protein</p>
              <p className="mt-1 text-2xl font-bold text-ash-grey-900">
                {dashboard.macrosConsumed.proteinG}g
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-ash-grey-500">Water</p>
              <p className="mt-1 text-2xl font-bold text-ash-grey-900">
                {dashboard.waterMl}
                <span className="text-base font-normal text-ash-grey-500">
                  {' '}
                  / {dashboard.waterTargetMl} ml
                </span>
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-ash-grey-500">Health score</p>
              <p className="mt-1 text-2xl font-bold text-ash-grey-900">{dashboard.healthScore}</p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-ash-grey-900">Recent meals</h3>
          <Link to={CONSUMER_ROUTES.meals} className="text-sm font-semibold text-blue-spruce-600 hover:underline">
            View all
          </Link>
        </div>
        {recentMeals.length ? (
          <div className="grid gap-3">
            {recentMeals.map((meal) => (
              <Card key={meal.id}>
                <CardBody className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ash-grey-900">
                      {meal.mealName ?? meal.mealType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-ash-grey-500">
                      {new Date(meal.submittedAt).toLocaleString()} · {meal.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ash-grey-700">
                    {meal.totalNutrition?.caloriesKcal ?? '—'} kcal
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="py-10 text-center text-ash-grey-500">
              No meals logged yet. Use the mobile app to log your first meal — it will appear here
              after coach review.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
