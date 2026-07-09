import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import {
  useApproveNutritionFood,
  usePendingNutritionFoods,
  useRejectNutritionFood,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

export function AdminFoodDbPage() {
  const { data: foods, isLoading } = usePendingNutritionFoods();
  const approve = useApproveNutritionFood();
  const reject = useRejectNutritionFood();
  const toast = useToast();

  async function handleApprove(id: string) {
    try {
      await approve.mutateAsync(id);
      toast.success('Food entry approved and published.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not approve food'));
    }
  }

  async function handleReject(id: string) {
    try {
      await reject.mutateAsync(id);
      toast.success('Food entry rejected.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not reject food'));
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Nutrition database" />

      {isLoading ? (
        <p className="text-ash-grey-500">Loading pending submissions…</p>
      ) : foods?.length ? (
        <div className="grid gap-4">
          {foods.map((food) => (
            <Card key={food.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  {food.imageUrl ? (
                    <img
                      src={resolveMediaUrl(food.imageUrl) ?? ''}
                      alt={food.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ash-grey-100 text-2xl">
                      🍽️
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-ash-grey-900">{food.name}</h3>
                    <p className="text-sm text-ash-grey-500">
                      {food.category}
                      {food.brand ? ` · ${food.brand}` : ''}
                      {food.barcode ? ` · ${food.barcode}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-ash-grey-600">
                      {food.nutritionPer100g.caloriesKcal ?? 0} kcal / 100g · P{' '}
                      {food.nutritionPer100g.proteinG ?? 0}g · C {food.nutritionPer100g.carbsG ?? 0}g · F{' '}
                      {food.nutritionPer100g.fatG ?? 0}g
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-cinnamon-wood-100 px-2 py-0.5 text-xs font-semibold text-cinnamon-wood-700">
                      Pending approval
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={approve.isPending}
                    onClick={() => void handleApprove(food.id)}>
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={reject.isPending}
                    onClick={() => void handleReject(food.id)}>
                    Reject
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12 text-center text-ash-grey-500">
            No pending food submissions. Coaches can add entries from their nutrition database page.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
