import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { ClinicalAssessmentPanel } from '@/components/coach/ClinicalAssessmentPanel';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { FieldLabel, TextAreaField, TextField } from '@/components/ui/Field';
import { PhoneField } from '@/components/ui/PhoneField';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  useAdminPatientSummary,
  useAdminPatientView,
  useAdminResetPassword,
  useAdminUserDetail,
  useDeleteAdminUser,
  useOrganizations,
  useSetAdminClientCoaches,
  useUpdateAdminConsumerProfile,
  useUpdateAdminUser,
} from '@/features/admin/hooks/useAdminQueries';
import { fetchAdminCoaches, fetchAdminPatientCoachingInsights } from '@/features/admin/api/adminApi';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import { formatMealType, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { MealSubmission } from '@/types';

const MEALS_PAGE_SIZE = 10;

type PatientTab = 'overview' | 'assessment' | 'meals' | 'notes' | 'settings';

type AdminPatientProfileViewProps = {
  userId: string;
  patientId: string;
};

function CoachingInsightsCard({ userId }: { userId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'coaching-insights'],
    queryFn: () => fetchAdminPatientCoachingInsights(userId),
  });

  if (isLoading) return <p className="text-sm text-ash-grey-500">Loading coaching insights…</p>;
  if (!data.length) return null;

  return (
    <DashboardPanel title="Coaching insights">
      <div className="space-y-3 px-3 py-3">
        {data.map((item) => (
          <div key={item.id} className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
            <p className="font-semibold text-ash-grey-900">{item.title}</p>
            <p className="mt-1 text-sm text-ash-grey-600">{item.body}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function CoachAssignmentPanel({
  userId,
  assignedCoachIds,
}: {
  userId: string;
  assignedCoachIds: string[];
}) {
  const toast = useToast();
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['admin', 'coaches'],
    queryFn: fetchAdminCoaches,
  });
  const setCoaches = useSetAdminClientCoaches(userId);
  const [selected, setSelected] = useState<string[]>(assignedCoachIds);

  useEffect(() => {
    setSelected(assignedCoachIds);
  }, [assignedCoachIds]);

  const activeCoaches = coaches.filter((coach) => coach.isActive);

  async function save() {
    try {
      await setCoaches.mutateAsync(selected);
      toast.success('Assigned coaches updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update coach assignments'));
    }
  }

  function toggleCoach(coachId: string) {
    setSelected((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId],
    );
  }

  return (
    <DashboardPanel
      title="Assigned coaches"
      action={
        <Button size="sm" disabled={setCoaches.isPending} onClick={() => void save()}>
          Save coaches
        </Button>
      }>
      <div className="space-y-3 px-3 py-3 sm:px-4">
        <p className="text-sm text-ash-grey-600">
          Coaches listed here get this patient on their caseload. New patients are auto-assigned to
          the coach with the lightest caseload; you can override that here anytime.
        </p>
        {isLoading ? (
          <p className="text-sm text-ash-grey-500">Loading coaches…</p>
        ) : activeCoaches.length === 0 ? (
          <p className="text-sm text-ash-grey-500">No active coaches available.</p>
        ) : (
          <div className="space-y-2">
            {activeCoaches.map((coach) => (
              <label
                key={coach.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-ash-grey-100 px-3 py-2.5 hover:bg-ash-grey-50">
                <input
                  type="checkbox"
                  className="size-4 rounded border-ash-grey-300"
                  checked={selected.includes(coach.id)}
                  onChange={() => toggleCoach(coach.id)}
                />
                <div>
                  <p className="font-medium text-ash-grey-900">{coach.displayName}</p>
                  <p className="text-xs text-ash-grey-500">
                    {coach.profile?.title ?? 'Coach'}
                    {coach.profile?.organization ? ` · ${coach.profile.organization}` : ''}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}

function PatientSettingsTab({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const { data, isLoading } = useAdminUserDetail(userId);
  const { data: organizations } = useOrganizations();
  const updateUser = useUpdateAdminUser();
  const resetPassword = useAdminResetPassword();
  const deleteUser = useDeleteAdminUser();

  const user = data?.user;
  const [draft, setDraft] = useState({
    displayName: '',
    email: '',
    phone: '',
    membershipTier: 'standard' as 'standard' | 'pro',
    organizationId: '',
  });

  useEffect(() => {
    if (!user) return;
    setDraft({
      displayName: user.displayName,
      email: user.email,
      phone: user.phone ?? '',
      membershipTier: user.membershipTier,
      organizationId: user.organizationId ?? data?.organization?.id ?? '',
    });
  }, [user, data?.organization?.id]);

  const orgOptions = useMemo(
    () => [
      { value: '', label: 'No organization (individual)' },
      ...(organizations ?? [])
        .filter((org) => org.status === 'active')
        .map((org) => ({ value: org.id, label: org.name })),
    ],
    [organizations],
  );

  async function saveAccount() {
    if (!user) return;
    try {
      await updateUser.mutateAsync({
        userId,
        payload: {
          displayName: draft.displayName.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim() || null,
          membershipTier: draft.membershipTier,
          organizationId: draft.organizationId || undefined,
          organization: draft.organizationId
            ? organizations?.find((o) => o.id === draft.organizationId)?.name
            : undefined,
        },
      });
      toast.success('Account settings saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save account settings'));
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    const ok = await confirm({
      title: 'Email a new password?',
      description: `${user.displayName} will receive a temporary password by email and be signed out everywhere.`,
      confirmLabel: 'Send reset email',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const result = await resetPassword.mutateAsync({ userId, sendEmail: true });
      toast.success(
        result.emailSent ? 'Password reset email sent.' : 'Password was reset.',
        'Password reset',
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not reset password'));
    }
  }

  async function handleToggleActive() {
    if (!user) return;
    const next = !user.isActive;
    const ok = await confirm({
      title: next ? 'Activate account?' : 'Deactivate account?',
      description: next
        ? `${user.displayName} will be able to sign in again.`
        : `${user.displayName} will be blocked from signing in until reactivated.`,
      confirmLabel: next ? 'Activate' : 'Deactivate',
      tone: next ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      await updateUser.mutateAsync({ userId, payload: { isActive: next } });
      toast.success(next ? 'Account activated.' : 'Account deactivated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update account status'));
    }
  }

  async function handleRemoveFromOrganization() {
    if (!user?.organizationId && !data?.organization) {
      toast.error('This user is not in an organization.');
      return;
    }
    const ok = await confirm({
      title: 'Remove from organization?',
      description: `${user?.displayName} will become an individual account with no organization link.`,
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await updateUser.mutateAsync({
        userId,
        payload: { organizationId: '' },
      });
      setDraft((prev) => ({ ...prev, organizationId: '' }));
      toast.success('Removed from organization.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove organization'));
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    const ok = await confirm({
      title: 'Permanently delete this account?',
      description:
        'This removes patient data, meals, and clinical assessments, then tombstones the login. This cannot be undone.',
      confirmLabel: 'Delete account',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteUser.mutateAsync(userId);
      toast.success('Account deleted.');
      navigate(ADMIN_ROUTES.users);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete account'));
    }
  }

  if (isLoading || !user) {
    return <p className="text-sm text-ash-grey-500">Loading settings…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Account"
          action={
            <Button size="sm" disabled={updateUser.isPending} onClick={() => void saveAccount()}>
              Save changes
            </Button>
          }>
          <div className="space-y-4 px-3 py-3 sm:px-4">
            <TextField
              label="Display name"
              value={draft.displayName}
              onChange={(e) => setDraft((prev) => ({ ...prev, displayName: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
            <PhoneField
              label="Phone"
              value={draft.phone}
              onChange={(phone) => setDraft((prev) => ({ ...prev, phone }))}
            />
            <div>
              <FieldLabel>Membership tier</FieldLabel>
              <p className="mb-1.5 text-xs text-ash-grey-500">
                Pro patients jump to the front of the coach review queue.
              </p>
              <Select
                aria-label="Membership tier"
                value={draft.membershipTier}
                onChange={(next) =>
                  setDraft((prev) => ({ ...prev, membershipTier: next as 'standard' | 'pro' }))
                }
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'pro', label: 'Pro (priority reviews)' },
                ]}
              />
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Organization">
          <div className="space-y-4 px-3 py-3 sm:px-4">
            <div>
              <FieldLabel>Assign to organization</FieldLabel>
              <p className="mb-1.5 text-xs text-ash-grey-500">
                Link this patient to a clinic, company, or partner account.
              </p>
              <Select
                aria-label="Organization"
                value={draft.organizationId}
                onChange={(next) => setDraft((prev) => ({ ...prev, organizationId: next }))}
                options={orgOptions}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={updateUser.isPending} onClick={() => void saveAccount()}>
                Save organization
              </Button>
              {(user.organizationId || data.organization) && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateUser.isPending}
                  onClick={() => void handleRemoveFromOrganization()}>
                  Remove from organization
                </Button>
              )}
            </div>
            {data.organization ? (
              <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-4 py-3 text-sm text-ash-grey-600">
                Current: <span className="font-medium text-ash-grey-900">{data.organization.name}</span>
                <StatusPill tone={data.organization.status === 'active' ? 'good' : 'muted'} className="ml-2">
                  {data.organization.status}
                </StatusPill>
              </div>
            ) : (
              <p className="text-sm text-ash-grey-500">Not linked to an organization.</p>
            )}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel title="Security">
          <div className="space-y-4 px-3 py-3 sm:px-4">
            <p className="text-sm text-ash-grey-600">
              Send a temporary password by email. The user is signed out of all sessions.
            </p>
            <Button
              variant="primary"
              size="sm"
              disabled={resetPassword.isPending}
              onClick={() => void handleResetPassword()}>
              {resetPassword.isPending ? 'Sending…' : 'Email new password'}
            </Button>
            <dl className="grid gap-2 border-t border-ash-grey-100 pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ash-grey-500">Referral code</dt>
                <dd className="font-medium text-ash-grey-900">{user.referralCode ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ash-grey-500">Registration source</dt>
                <dd className="font-medium capitalize text-ash-grey-900">
                  {user.registrationSource ?? 'individual'}
                </dd>
              </div>
              {data.subscription ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-500">Subscription</dt>
                    <dd className="font-medium text-ash-grey-900">{data.subscription.planCode}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ash-grey-500">Billing status</dt>
                    <dd className="font-medium capitalize text-ash-grey-900">{data.subscription.status}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Danger zone">
          <div className="space-y-4 px-3 py-3 sm:px-4">
            <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-4 py-3">
              <p className="font-medium text-ash-grey-900">
                {user.isActive ? 'Deactivate account' : 'Reactivate account'}
              </p>
              <p className="mt-1 text-sm text-ash-grey-600">
                {user.isActive
                  ? 'Blocks sign-in without deleting patient history.'
                  : 'Restores sign-in access for this account.'}
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                disabled={updateUser.isPending}
                onClick={() => void handleToggleActive()}>
                {user.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
              <p className="font-medium text-red-900">Delete account</p>
              <p className="mt-1 text-sm text-red-800/80">
                Permanently removes meals, clinical data, and login access. Prefer deactivate when you
                only need to pause access.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                disabled={deleteUser.isPending}
                onClick={() => void handleDeleteAccount()}>
                {deleteUser.isPending ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {dialog}
    </div>
  );
}

export function AdminPatientProfileView({ userId, patientId }: AdminPatientProfileViewProps) {
  const toast = useToast();
  const { data, isLoading } = useAdminPatientView(userId);
  const { data: summary } = useAdminPatientSummary(userId);
  const updateConsumer = useUpdateAdminConsumerProfile();
  const [tab, setTab] = useState<PatientTab>('overview');
  const [mealSearch, setMealSearch] = useState('');
  const [mealStatus, setMealStatus] = useState('all');
  const [mealType, setMealType] = useState('all');
  const [mealPage, setMealPage] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const notes = data?.client.profile.adminNotes;
    if (typeof notes === 'string') setAdminNotes(notes);
  }, [data?.client.profile.adminNotes]);

  const meals = data?.meals ?? [];
  const mealTypes = useMemo(
    () => [...new Set(meals.map((meal) => meal.mealType))].sort(),
    [meals],
  );

  const filteredMeals = useMemo(() => {
    const query = mealSearch.trim().toLowerCase();
    return [...meals]
      .filter((meal) => {
        if (mealStatus !== 'all' && meal.status !== mealStatus) return false;
        if (mealType !== 'all' && meal.mealType !== mealType) return false;
        if (!query) return true;
        return (
          (meal.mealName ?? '').toLowerCase().includes(query) ||
          formatMealType(meal.mealType).toLowerCase().includes(query)
        );
      })
      .sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
      );
  }, [meals, mealSearch, mealStatus, mealType]);

  const paginatedMeals = useMemo(
    () =>
      filteredMeals.slice((mealPage - 1) * MEALS_PAGE_SIZE, mealPage * MEALS_PAGE_SIZE),
    [filteredMeals, mealPage],
  );

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredMeals.length / MEALS_PAGE_SIZE));
    if (mealPage > lastPage) setMealPage(lastPage);
  }, [filteredMeals.length, mealPage]);

  const mealColumns: DataTableColumn<MealSubmission>[] = useMemo(
    () => [
      {
        key: 'meal',
        header: 'Meal',
        cell: (meal) => (
          <div>
            <p className="font-semibold text-ash-grey-900">{meal.mealName ?? 'Meal'}</p>
            <p className="text-xs text-ash-grey-500">{formatMealType(meal.mealType)}</p>
          </div>
        ),
      },
      {
        key: 'submitted',
        header: 'Submitted',
        cell: (meal) => (
          <span className="text-ash-grey-600">{formatRelativeTime(meal.submittedAt)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (meal) => <StatusBadge status={meal.status} />,
      },
      {
        key: 'kcal',
        header: 'Kcal',
        cell: (meal) =>
          meal.totalNutrition ? (
            <span className="text-ash-grey-700">{meal.totalNutrition.caloriesKcal}</span>
          ) : (
            <span className="text-ash-grey-400">—</span>
          ),
      },
    ],
    [],
  );

  async function saveAdminNotes() {
    try {
      await updateConsumer.mutateAsync({
        userId,
        payload: { notes: adminNotes },
      });
      toast.success('Admin notes saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save admin notes'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ash-grey-500">Loading patient profile…</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-600">Patient profile could not be loaded.</p>;
  }

  return (
    <div className="space-y-5">
      <Tabs
        variant="segmented"
        active={tab}
        onChange={(id) => setTab(id as PatientTab)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'assessment', label: 'Clinical assessment' },
          { id: 'meals', label: 'Meals', count: meals.length || undefined },
          { id: 'notes', label: 'Admin notes' },
          { id: 'settings', label: 'Settings' },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <ClientPanel client={data.client} showPreferences />
          <div className="space-y-5">
            <CoachAssignmentPanel
              userId={userId}
              assignedCoachIds={data.assignedCoachIds ?? []}
            />
            <CoachingInsightsCard userId={userId} />
            {summary ? (
              <DashboardPanel title={`Weekly summary · since ${summary.weekStart}`}>
                <div className="px-3 py-3">
                  <KpiStrip
                    items={[
                      { label: 'Days logged', value: summary.daysLogged },
                      { label: 'Meals submitted', value: summary.mealsSubmitted },
                      { label: 'Approved', value: summary.approvedCount },
                      { label: 'Adherence', value: `${summary.adherenceRate}%` },
                      { label: 'Avg daily kcal', value: summary.avgDailyCalories },
                      {
                        label: 'Protein (week)',
                        value: `${summary.totals.proteinG}g`,
                        caption: `Target ${summary.targets.proteinG * 7}g`,
                      },
                    ]}
                  />
                </div>
              </DashboardPanel>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'assessment' ? (
        <ClinicalAssessmentPanel clientId={patientId} adminUserId={userId} />
      ) : null}

      {tab === 'meals' ? (
        <DashboardPanel title="Meal history">
          <div className="flex flex-wrap items-end gap-3 border-b border-ash-grey-100 px-3 py-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Search
              </span>
              <SearchInput
                value={mealSearch}
                onValueChange={(value) => {
                  setMealSearch(value);
                  setMealPage(1);
                }}
                placeholder="Search meal name or type"
                size="sm"
              />
            </label>
            <label className="min-w-[160px]">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Status
              </span>
              <Select
                aria-label="Filter meals by status"
                variant="filter"
                size="sm"
                value={mealStatus}
                onChange={(value) => {
                  setMealStatus(value);
                  setMealPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'analyzing', label: 'Analyzing' },
                  { value: 'in_review', label: 'In review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </label>
            <label className="min-w-[160px]">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Meal type
              </span>
              <Select
                aria-label="Filter meals by type"
                variant="filter"
                size="sm"
                value={mealType}
                onChange={(value) => {
                  setMealType(value);
                  setMealPage(1);
                }}
                options={[
                  { value: 'all', label: 'All meal types' },
                  ...mealTypes.map((type) => ({
                    value: type,
                    label: formatMealType(type),
                  })),
                ]}
              />
            </label>
          </div>
          <DataTable
            columns={mealColumns}
            rows={paginatedMeals}
            rowKey={(meal) => meal.id}
            emptyTitle={meals.length ? 'No meals match these filters' : 'No meals yet'}
          />
          <Pagination
            page={mealPage}
            pageSize={MEALS_PAGE_SIZE}
            total={filteredMeals.length}
            onPageChange={setMealPage}
          />
        </DashboardPanel>
      ) : null}

      {tab === 'notes' ? (
        <DashboardPanel
          title="Internal admin notes"
          action={
            <Button size="sm" disabled={updateConsumer.isPending} onClick={() => void saveAdminNotes()}>
              Save notes
            </Button>
          }>
          <div className="px-3 py-3">
            <TextAreaField
              label="Notes for coaches and admins"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              hint="Not visible to the patient in the app."
            />
          </div>
        </DashboardPanel>
      ) : null}

      {tab === 'settings' ? <PatientSettingsTab userId={userId} /> : null}
    </div>
  );
}
