import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { useAdminConsumers, useAdminUsers, useSetUserRole } from '@/features/admin/hooks/useAdminQueries';
import { formatGoal } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

const ASSIGNABLE_ROLES = [
  'consumer',
  'coach',
  'nutrition_coach',
  'data_entry_staff',
  'organization_admin',
  'admin',
] as const;

export function AdminUsersPage() {
  const { data: consumers, isLoading: consumersLoading } = useAdminConsumers();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const setRole = useSetUserRole();
  const toast = useToast();

  async function handleRoleChange(userId: string, role: string) {
    try {
      await setRole.mutateAsync({ userId, role });
      toast.success('Role updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update role'));
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Users & roles" />

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-ash-grey-900">Platform accounts</h3>
        {usersLoading ? (
          <p className="text-ash-grey-500">Loading users…</p>
        ) : users?.length ? (
          <div className="overflow-x-auto rounded-2xl border border-ash-grey-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-ash-grey-50 text-left text-ash-grey-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-ash-grey-100">
                    <td className="px-4 py-3 font-medium text-ash-grey-900">{user.displayName}</td>
                    <td className="px-4 py-3 text-ash-grey-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                        disabled={setRole.isPending}
                        className="rounded-lg border border-ash-grey-200 px-2 py-1 text-sm">
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-ash-grey-600">{user.registrationSource ?? 'individual'}</td>
                    <td className="px-4 py-3 text-ash-grey-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card>
            <CardBody className="py-8 text-center text-ash-grey-500">No users found.</CardBody>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-ash-grey-900">Consumers</h3>
        {consumersLoading ? (
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
                      <p className="truncate text-sm text-ash-grey-500">
                        {consumer.patientId ?? consumer.id}
                        {consumer.email ? ` · ${consumer.email}` : ''}
                      </p>
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
      </section>
    </div>
  );
}
