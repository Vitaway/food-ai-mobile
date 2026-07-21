import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BanIcon, PlusIcon, RefreshIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField, TextField } from '@/components/ui/Field';
import {
  useAdminCoachRoster,
  useAdminUsers,
  useCreateAdminUser,
  useOrganizations,
  useSetUserActive,
  useSetUserRole,
} from '@/features/admin/hooks/useAdminQueries';
import { formatGoal } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { AdminUserRow, CreateAdminUserPayload, SetUserRolePayload } from '@/features/admin/api/adminApi';
import { ADMIN_ROUTES } from '@/features/auth/constants';

import type { AdminCoachRosterRow } from '@/types';

type UserFilter = 'all' | 'consumer' | 'coach' | 'admin' | 'staff';

const FILTER_OPTIONS: { id: UserFilter; label: string }[] = [
  { id: 'all', label: 'All users' },
  { id: 'consumer', label: 'Patients' },
  { id: 'coach', label: 'Coaches' },
  { id: 'admin', label: 'Admins' },
  { id: 'staff', label: 'Staff' },
];

function isCoachRole(role: string) {
  return role === 'coach' || role === 'nutrition_coach';
}

type UserTableRow = AdminUserRow & { roster?: AdminCoachRosterRow };

const USER_ROLE_OPTIONS: { value: CreateAdminUserPayload['role']; label: string }[] = [
  { value: 'consumer', label: 'Patient / consumer' },
  { value: 'coach', label: 'Coach' },
  { value: 'nutrition_coach', label: 'Nutrition coach' },
  { value: 'organization_admin', label: 'Organization admin' },
  { value: 'data_entry_staff', label: 'Data entry staff' },
  { value: 'admin', label: 'Platform admin' },
];

const REGISTRATION_SOURCE_OPTIONS = [
  { value: 'admin_created', label: 'Admin created' },
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company / corporate' },
  { value: 'institution', label: 'Institution / clinic' },
];

const DEFAULT_CREATE_FORM = {
  email: '',
  password: '',
  displayName: '',
  role: 'consumer' as CreateAdminUserPayload['role'],
  membershipTier: 'standard' as 'standard' | 'pro',
  registrationSource: 'admin_created' as CreateAdminUserPayload['registrationSource'],
  organizationId: '',
  title: '',
  bio: '',
  goal: '',
  allergies: '',
};

function roleLabel(role: string) {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function matchesFilter(user: AdminUserRow, filter: UserFilter) {
  if (filter === 'all') return true;
  if (filter === 'consumer') return user.role === 'consumer';
  if (filter === 'coach') return isCoachRole(user.role);
  if (filter === 'admin') return user.role === 'admin' || user.role === 'organization_admin';
  if (filter === 'staff') return user.role === 'data_entry_staff';
  return true;
}

function roleRequiresOrganization(role: string) {
  return role === 'organization_admin';
}

function roleChangeSummary(user: AdminUserRow, nextRole: string, organizationName?: string) {
  const from = roleLabel(user.role);
  const to = roleLabel(nextRole);
  const lines = [`Move ${user.displayName} from ${from} to ${to}.`];

  if (nextRole === 'consumer') {
    lines.push('Creates a patient profile if one does not exist yet.');
  }
  if (isCoachRole(nextRole)) {
    lines.push(`Coach profile will be linked to ${organizationName?.trim() || 'Vitaway'}.`);
  }
  if (nextRole === 'organization_admin') {
    lines.push(`Organization admin access will be scoped to ${organizationName?.trim()}.`);
    lines.push('A patient profile is also created so they can track meals.');
  }
  if (nextRole === 'admin') {
    lines.push('This grants full platform admin access.');
  }

  return lines.join(' ');
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: roster } = useAdminCoachRoster();
  const { data: organizations = [] } = useOrganizations();
  const setRole = useSetUserRole();
  const setActive = useSetUserActive();
  const createUser = useCreateAdminUser();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const filterParam = searchParams.get('type');
  const activeFilter: UserFilter =
    filterParam === 'consumer' ||
    filterParam === 'coach' ||
    filterParam === 'admin' ||
    filterParam === 'staff'
      ? filterParam
      : 'all';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_CREATE_FORM);
  const [roleChangeUser, setRoleChangeUser] = useState<AdminUserRow | null>(null);
  const [roleChangeForm, setRoleChangeForm] = useState({
    role: 'consumer' as SetUserRolePayload['role'],
    organizationId: '',
    title: '',
  });

  const rosterByUserId = useMemo(() => {
    return new Map((roster ?? []).map((row) => [row.id, row]));
  }, [roster]);

  const tableRows = useMemo<UserTableRow[]>(() => {
    return (users ?? [])
      .filter((user) => matchesFilter(user, activeFilter))
      .map((user) => ({
        ...user,
        roster: rosterByUserId.get(user.id),
      }));
  }, [users, activeFilter, rosterByUserId]);

  const coachRosterSummary = useMemo(() => {
    const coachRows = (roster ?? []).filter((row) => row.isActive);
    return {
      clients: coachRows.reduce((sum, row) => sum + row.assignedClients, 0),
      avgCorrection:
        coachRows.length > 0
          ? Math.round(
              coachRows.reduce((sum, row) => sum + row.correctionRate, 0) / coachRows.length,
            )
          : 0,
    };
  }, [roster]);

  useEffect(() => {
    if (activeFilter === 'coach') {
      setForm((prev) => ({ ...prev, role: 'coach' }));
    }
  }, [activeFilter]);

  function setFilter(next: UserFilter) {
    if (next === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type: next });
    }
  }

  async function toggleActive(user: AdminUserRow) {
    if (user.role === 'admin') {
      toast.error('Platform admin accounts cannot be deactivated here.');
      return;
    }
    const activating = !user.isActive;
    const ok = await confirm({
      title: activating ? 'Reactivate account?' : 'Deactivate account?',
      description: activating
        ? `${user.displayName} will be able to sign in again.`
        : `${user.displayName} will lose access until reactivated.`,
      confirmLabel: activating ? 'Reactivate' : 'Deactivate',
      tone: activating ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      await setActive.mutateAsync({ userId: user.id, isActive: activating });
      toast.success(activating ? 'Account reactivated.' : 'Account deactivated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update account status'));
    }
  }

  const organizationOptions = useMemo(
    () => organizations.map((org) => ({ value: org.id, label: org.name })),
    [organizations],
  );

  const orgNameById = useMemo(
    () => new Map(organizations.map((org) => [org.id, org.name])),
    [organizations],
  );

  const userSummary = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      coaches: list.filter((u) => isCoachRole(u.role)).length,
      admins: list.filter((u) => u.role === 'admin' || u.role === 'organization_admin').length,
      consumers: list.filter((u) => u.role === 'consumer').length,
    };
  }, [users]);

  const isCreateCoachRole = isCoachRole(form.role);
  const createNeedsOrganization = form.role === 'organization_admin' || isCreateCoachRole;

  const roleChangeNeedsOrganization = roleChangeUser
    ? roleRequiresOrganization(roleChangeForm.role)
    : false;

  function closeCreateForm() {
    setShowCreateForm(false);
    setForm(DEFAULT_CREATE_FORM);
  }

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openRoleChangeModal(user: AdminUserRow) {
    setRoleChangeUser(user);
    setRoleChangeForm({
      role: user.role as SetUserRolePayload['role'],
      organizationId: user.organizationId ?? '',
      title: user.title ?? '',
    });
  }

  function closeRoleChangeModal() {
    setRoleChangeUser(null);
    setRoleChangeForm({ role: 'consumer', organizationId: '', title: '' });
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    if (form.role === 'organization_admin' && !form.organizationId.trim()) {
      toast.error('Organization is required for organization admin accounts.');
      return;
    }

    const roleText = roleLabel(form.role);
    const ok = await confirm({
      title: 'Create user account?',
      description: `${form.displayName.trim() || 'This user'} will be added as a ${roleText.toLowerCase()} and receive sign-in credentials by email.`,
      confirmLabel: 'Create account',
    });
    if (!ok) return;

    try {
      const payload: CreateAdminUserPayload = {
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        role: form.role,
        membershipTier: form.membershipTier,
        registrationSource: form.registrationSource,
        sendInviteEmail: true,
      };

      if (form.password.trim()) payload.password = form.password.trim();
      if (form.organizationId.trim()) payload.organizationId = form.organizationId.trim();
      if (isCreateCoachRole) {
        if (form.title.trim()) payload.title = form.title.trim();
        if (form.bio.trim()) payload.bio = form.bio.trim();
      }
      if (form.role === 'consumer') {
        if (form.goal.trim()) payload.goal = form.goal.trim();
        if (form.allergies.trim()) {
          payload.allergies = form.allergies
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }

      const result = await createUser.mutateAsync(payload);
      toast.success(
        result.emailSent ? 'Account created and invite email sent.' : 'Account created successfully.',
        'User added',
      );
      closeCreateForm();
      navigate(`${ADMIN_ROUTES.users}/${result.user.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create user'));
    }
  }

  async function handleRoleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!roleChangeUser) return;

    if (roleChangeForm.role === roleChangeUser.role) {
      toast.error('Choose a different account type.');
      return;
    }

    if (roleRequiresOrganization(roleChangeForm.role) && !roleChangeForm.organizationId.trim()) {
      toast.error('Organization is required for this account type.');
      return;
    }

    const orgName = orgNameById.get(roleChangeForm.organizationId);
    const ok = await confirm({
      title: 'Confirm account type change',
      description: roleChangeSummary(roleChangeUser, roleChangeForm.role, orgName),
      confirmLabel: 'Change account type',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      const payload: SetUserRolePayload = { role: roleChangeForm.role };
      if (roleChangeForm.organizationId.trim()) {
        payload.organizationId = roleChangeForm.organizationId.trim();
      }
      if (roleChangeForm.title.trim()) payload.title = roleChangeForm.title.trim();

      await setRole.mutateAsync({ userId: roleChangeUser.id, ...payload });
      toast.success('Account type updated.');
      closeRoleChangeModal();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not change account type'));
    }
  }

  const showCoachMetrics = activeFilter === 'coach' || activeFilter === 'all';

  const columns: DataTableColumn<UserTableRow>[] = [
    {
      key: 'name',
      header: 'User',
      cell: (user) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{user.displayName}</p>
          {user.patientId ? (
            <p className="text-xs text-ash-grey-500">{user.patientId}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (user) => <span className="text-ash-grey-600">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Account type',
      cell: (user) => (
        <StatusPill tone={user.role === 'admin' ? 'warn' : isCoachRole(user.role) ? 'good' : 'info'}>
          {roleLabel(user.role)}
        </StatusPill>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      cell: (user) => (
        <span className="text-ash-grey-700">
          {user.organization ?? user.roster?.organization ?? '—'}
        </span>
      ),
    },
    ...(showCoachMetrics
      ? ([
          {
            key: 'clients',
            header: 'Clients',
            cell: (user: UserTableRow) =>
              isCoachRole(user.role) ? (
                <span>{user.roster?.assignedClients ?? '—'}</span>
              ) : (
                <span className="text-ash-grey-400">—</span>
              ),
          },
          {
            key: 'correction',
            header: 'Correction',
            cell: (user: UserTableRow) =>
              isCoachRole(user.role) && user.roster ? (
                <span>{user.roster.correctionRate}%</span>
              ) : (
                <span className="text-ash-grey-400">—</span>
              ),
          },
          {
            key: 'turnaround',
            header: 'Turnaround',
            cell: (user: UserTableRow) =>
              isCoachRole(user.role) && user.roster ? (
                <span>{user.roster.avgTurnaroundHours}h</span>
              ) : (
                <span className="text-ash-grey-400">—</span>
              ),
          },
        ] as DataTableColumn<UserTableRow>[])
      : []),
    {
      key: 'tier',
      header: 'Tier',
      cell: (user) => (
        <StatusPill tone={user.membershipTier === 'pro' ? 'good' : 'muted'}>
          {user.membershipTier === 'pro' ? 'Pro' : 'Standard'}
        </StatusPill>
      ),
    },
    {
      key: 'goal',
      header: 'Goal',
      cell: (user) => (
        <span className="capitalize text-ash-grey-700">
          {user.goal ? formatGoal(user.goal) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) => (
        <StatusPill tone={user.isActive ? 'good' : 'bad'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
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
    {
      key: 'actions',
      header: '',
      cell: (user) => (
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" onClick={() => openRoleChangeModal(user)}>
            Change type
          </Button>
          {user.role !== 'admin' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={user.isActive ? <BanIcon /> : <RefreshIcon />}
              disabled={setActive.isPending}
              onClick={() => void toggleActive(user)}>
              {user.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Users & roles"
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<PlusIcon />}
            onClick={() => setShowCreateForm(true)}>
            Add user
          </Button>
        }
      />

      <KpiStrip
        columns={4}
        items={
          activeFilter === 'coach'
            ? [
                { label: 'Coaches', value: tableRows.length, tone: 'info', caption: 'In this view' },
                {
                  label: 'Active',
                  value: tableRows.filter((u) => u.isActive).length,
                  tone: 'success',
                  caption: 'Can sign in',
                },
                {
                  label: 'Assigned clients',
                  value: coachRosterSummary.clients,
                  tone: 'warn',
                  caption: 'Across roster',
                },
                {
                  label: 'Avg correction',
                  value: `${coachRosterSummary.avgCorrection}%`,
                  tone: 'default',
                  caption: 'Coach edits',
                },
              ]
            : [
                { label: 'Accounts', value: userSummary.total, tone: 'info', caption: 'Platform users' },
                { label: 'Coaches', value: userSummary.coaches, tone: 'success', caption: 'Review access' },
                { label: 'Admins', value: userSummary.admins, tone: 'warn', caption: 'Elevated roles' },
                {
                  label: 'Consumers',
                  value: userSummary.consumers,
                  tone: 'default',
                  caption: 'Patient accounts',
                },
              ]
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={activeFilter === option.id ? 'primary' : 'outline'}
            onClick={() => setFilter(option.id)}>
            {option.label}
          </Button>
        ))}
      </div>

      <DashboardPanel title={activeFilter === 'all' ? 'All users' : `${FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label ?? 'Users'}`}>
        {usersLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading users…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={tableRows}
            rowKey={(u) => u.id}
            onRowClick={(user) => navigate(`${ADMIN_ROUTES.users}/${user.id}`)}
            emptyTitle="No users found"
            emptyDescription="Try another filter or use Add user to create an account."
          />
        )}
      </DashboardPanel>

      <Modal
        open={showCreateForm}
        onClose={closeCreateForm}
        title="New user account"
        description="Create any platform role — patients, coaches, organization admins, and staff. Leave password blank to auto-generate one."
        size="xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeCreateForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              variant="primary"
              disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        }>
        <form
          id="create-user-form"
          onSubmit={(e) => void handleCreateUser(e)}
          className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            required
            value={form.displayName}
            onChange={(e) => updateForm('displayName', e.target.value)}
            placeholder="Jane Doe"
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="user@vitaway.org"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-ash-grey-800">Account type</label>
            <Select
              aria-label="Account type"
              value={form.role}
              onChange={(next) => updateForm('role', next as CreateAdminUserPayload['role'])}
              options={USER_ROLE_OPTIONS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-ash-grey-800">Membership tier</label>
            <Select
              aria-label="Membership tier"
              value={form.membershipTier}
              onChange={(next) => updateForm('membershipTier', next as 'standard' | 'pro')}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'pro', label: 'Pro (priority reviews)' },
              ]}
            />
          </div>
          <TextField
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={(e) => updateForm('password', e.target.value)}
            placeholder="Leave blank to auto-generate"
            hint="At least 8 characters if set manually"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-ash-grey-800">Registration source</label>
            <Select
              aria-label="Registration source"
              value={form.registrationSource ?? 'admin_created'}
              onChange={(next) =>
                updateForm('registrationSource', next as CreateAdminUserPayload['registrationSource'])
              }
              options={REGISTRATION_SOURCE_OPTIONS}
            />
          </div>

          {createNeedsOrganization ? (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium text-ash-grey-800">
                Organization {form.role === 'organization_admin' ? '(required)' : '(optional)'}
              </label>
              <Select
                aria-label="Organization"
                value={form.organizationId}
                onChange={(next) => updateForm('organizationId', next)}
                options={[
                  { value: '', label: 'Select organization…' },
                  ...organizationOptions,
                ]}
              />
              <p className="text-xs text-ash-grey-500">
                Create organizations under Organizations first. Coaches may omit this for Vitaway
                internal staff.
              </p>
            </div>
          ) : null}

          {isCreateCoachRole ? (
            <>
              <TextField
                label="Title"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder={
                  form.role === 'nutrition_coach' ? 'Clinical Nutrition Coach' : 'Nutrition Coach'
                }
              />
              <TextAreaField
                label="Bio"
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Optional background for the coach profile"
                className="sm:col-span-2"
              />
            </>
          ) : null}

          {form.role === 'consumer' ? (
            <>
              <TextField
                label="Health goal"
                value={form.goal}
                onChange={(e) => updateForm('goal', e.target.value)}
                placeholder="e.g. weight_loss"
              />
              <TextField
                label="Allergies"
                value={form.allergies}
                onChange={(e) => updateForm('allergies', e.target.value)}
                placeholder="peanuts, shellfish"
                hint="Comma-separated"
              />
            </>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(roleChangeUser)}
        onClose={closeRoleChangeModal}
        title="Change account type"
        description={
          roleChangeUser
            ? `Current type: ${roleLabel(roleChangeUser.role)}${
                roleChangeUser.organization ? ` · ${roleChangeUser.organization}` : ''
              }`
            : undefined
        }
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeRoleChangeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="change-role-form"
              variant="primary"
              disabled={setRole.isPending}>
              {setRole.isPending ? 'Updating…' : 'Change account type'}
            </Button>
          </div>
        }>
        {roleChangeUser ? (
          <form id="change-role-form" onSubmit={(e) => void handleRoleChange(e)} className="space-y-4">
            <div className="rounded-2xl border border-cinnamon-wood-100 bg-cinnamon-wood-50/60 px-4 py-3 text-sm text-ash-grey-700">
              {roleChangeSummary(
                roleChangeUser,
                roleChangeForm.role,
                orgNameById.get(roleChangeForm.organizationId),
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-ash-grey-800">New account type</label>
              <Select
                aria-label="New account type"
                value={roleChangeForm.role}
                onChange={(next) =>
                  setRoleChangeForm((prev) => ({
                    ...prev,
                    role: next as SetUserRolePayload['role'],
                  }))
                }
                options={USER_ROLE_OPTIONS}
              />
            </div>

            {roleChangeNeedsOrganization || isCoachRole(roleChangeForm.role) ? (
              <div className="space-y-1">
                <label className="text-sm font-medium text-ash-grey-800">
                  Organization {roleChangeForm.role === 'organization_admin' ? '(required)' : '(optional)'}
                </label>
                <Select
                  aria-label="Organization"
                  value={roleChangeForm.organizationId}
                  onChange={(next) =>
                    setRoleChangeForm((prev) => ({ ...prev, organizationId: next }))
                  }
                  options={[
                    { value: '', label: 'Select organization…' },
                    ...organizationOptions,
                  ]}
                />
              </div>
            ) : null}

            {isCoachRole(roleChangeForm.role) ? (
              <TextField
                label="Coach title"
                value={roleChangeForm.title}
                onChange={(e) =>
                  setRoleChangeForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder={
                  roleChangeForm.role === 'nutrition_coach'
                    ? 'Clinical Nutrition Coach'
                    : 'Nutrition Coach'
                }
              />
            ) : null}
          </form>
        ) : null}
      </Modal>

      {confirmDialog}
    </div>
  );
}
