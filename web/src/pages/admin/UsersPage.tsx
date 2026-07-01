import { Card, CardBody } from '@/components/ui/Card';
import { useAdminConsumers } from '@/features/admin/hooks/useAdminQueries';
import { formatGoal } from '@/lib/utils';

export function AdminUsersPage() {
  const { data: consumers, isLoading } = useAdminConsumers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">Consumers</h2>
        <p className="mt-1 text-ash-grey-600">
          Mobile app users on the platform. Consumer accounts will sync here once mobile auth ships.
        </p>
      </div>

      {isLoading ? (
        <p className="text-ash-grey-500">Loading consumers…</p>
      ) : consumers?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consumers.map((consumer) => (
            <Card key={consumer.id}>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-shamrock-100 text-base font-bold text-shamrock-700">
                    {String(consumer.displayName).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-ash-grey-900">{consumer.displayName}</h3>
                    <p className="truncate text-sm text-ash-grey-500">{consumer.email ?? consumer.id}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ash-grey-500">Goal</dt>
                    <dd className="capitalize text-ash-grey-800">
                      {consumer.goal ? formatGoal(consumer.goal) : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ash-grey-500">Health score</dt>
                    <dd className="font-semibold text-blue-spruce-700">
                      {consumer.healthScore ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ash-grey-500">Since</dt>
                    <dd className="text-ash-grey-700">
                      {new Date(consumer.memberSince).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="py-12 text-center text-ash-grey-500">No consumers found.</CardBody>
        </Card>
      )}
    </div>
  );
}
