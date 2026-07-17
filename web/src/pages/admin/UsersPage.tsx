import { useState } from 'react';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAdminConsumers, useAdminUsers, useSetUserRole } from '@/features/admin/hooks/useAdminQueries';
import { formatGoal } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { AdminConsumer, AdminUserRow } from '@/features/admin/api/adminApi';

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
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});

  async function handleRoleChange(user: AdminUserRow, nextRole: string) {
    if (nextRole === user.role) return;
    const ok = await confirm({
      title: 'Change user role?',
      description: `Update ${user.displayName} from “${user.role}” to “${nextRole}”. This changes what they can access.`,
      confirmLabel: 'Update role',
      tone: 'danger',
    });
    if (!ok) {
      setRoleDraft((prev) => ({ ...prev, [user.id]: user.role }));
      return;
    }
    try {
      await setRole.mutateAsync({ userId: user.id, role: nextRole });
      toast.success('Role updated.');
      setRoleDraft((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update role'));
      setRoleDraft((prev) => ({ ...prev, [user.id]: user.role }));
    }
  }

  const userColumns: DataTableColumn<AdminUserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => <span className="font-semibold text-ash-grey-900">{user.displayName}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (user) => <span className="text-ash-grey-600">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <select
          value={roleDraft[user.id] ?? user.role}
          onChange={(e) => {
            const next = e.target.value;
            setRoleDraft((prev) => ({ ...prev, [user.id]: next }));
            void handleRoleChange(user, next);
          }}
          disabled={setRole.isPending}
          className="rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm outline-none focus:border-blue-spruce-400"
          onClick={(e) => e.stopPropagation()}>
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (user) => (
        <StatusPill tone="muted">{user.registrationSource ?? 'individual'}</StatusPill>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (user) => (
        <span className="text-ash-grey-600">{new Date(user.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  const consumerColumns: DataTableColumn<AdminConsumer>[] = [
    {
      key: 'name',
      header: 'Patient',
      cell: (c) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{c.displayName}</p>
          <p className="text-xs text-ash-grey-500">{c.patientId ?? c.id}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (c) => <span className="text-ash-grey-600">{c.email ?? '—'}</span>,
    },
    {
      key: 'goal',
      header: 'Goal',
      cell: (c) => (
        <span className="capitalize text-ash-grey-700">{c.goal ? formatGoal(c.goal) : '—'}</span>
      ),
    },
    {
      key: 'score',
      header: 'Health score',
      cell: (c) =>
        c.healthScore != null ? (
          <StatusPill tone="info">{c.healthScore}</StatusPill>
        ) : (
          <span className="text-ash-grey-400">—</span>
        ),
    },
    {
      key: 'since',
      header: 'Since',
      cell: (c) => (
        <span className="text-ash-grey-600">{new Date(c.memberSince).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Users & roles" />

      <DashboardPanel title="Platform accounts">
        {usersLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading users…</p>
        ) : (
          <DataTable
            columns={userColumns}
            rows={users ?? []}
            rowKey={(u) => u.id}
            emptyTitle="No users found"
          />
        )}
      </DashboardPanel>

      <DashboardPanel title="Consumers">
        {consumersLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading consumers…</p>
        ) : (
          <DataTable
            columns={consumerColumns}
            rows={consumers ?? []}
            rowKey={(c) => c.id}
            emptyTitle="No consumers found"
          />
        )}
      </DashboardPanel>

      {confirmDialog}
    </div>
  );
}
