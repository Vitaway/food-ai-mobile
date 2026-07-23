import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminPatientProfileView } from '@/components/admin/AdminPatientProfileView';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { Button } from '@/components/ui/Button';
import { FieldLabel, TextField, TextAreaField } from '@/components/ui/Field';
import { PhoneField } from '@/components/ui/PhoneField';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import {
  useAdminResetPassword,
  useAdminUserDetail,
  useUpdateAdminCoachProfile,
  useUpdateAdminUser,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

const USER_ROLE_OPTIONS = [
  { value: 'consumer', label: 'Patient / consumer' },
  { value: 'coach', label: 'Coach' },
  { value: 'nutrition_coach', label: 'Nutrition coach' },
  { value: 'organization_admin', label: 'Organization admin' },
  { value: 'data_entry_staff', label: 'Data entry staff' },
  { value: 'admin', label: 'Platform admin' },
] as const;

function isCoachRole(role: string) {
  return role === 'coach' || role === 'nutrition_coach';
}

function roleRequiresOrganization(role: string, existingOrganization?: string | null) {
  if (role === 'organization_admin') return true;
  if (isCoachRole(role) && !existingOrganization?.trim()) return true;
  return false;
}

function tierTone(tier: string): 'info' | 'good' | 'muted' {
  if (tier === 'pro') return 'good';
  return 'muted';
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data, isLoading, isError } = useAdminUserDetail(id ?? null);
  const updateUser = useUpdateAdminUser();
  const updateCoach = useUpdateAdminCoachProfile();
  const resetPassword = useAdminResetPassword();

  const [accountDraft, setAccountDraft] = useState<Record<string, string>>({});
  const [coachDraft, setCoachDraft] = useState<Record<string, string>>({});
  const [showAccountPanel, setShowAccountPanel] = useState(false);

  const user = data?.user;
  const coachProfile = data?.coachProfile;
  const isPatient = Boolean(data?.consumerProfile);

  async function saveAccount() {
    if (!id || !user) return;

    const nextRole = accountDraft.role ?? user.role;
    const nextOrganization =
      accountDraft.organization ?? coachDraft.organization ?? coachProfile?.organization ?? '';
    const roleChanged = nextRole !== user.role;

    if (roleChanged) {
      if (roleRequiresOrganization(nextRole, coachProfile?.organization) && !nextOrganization.trim()) {
        toast.error('Organization is required for this account type.');
        return;
      }
      const ok = await confirm({
        title: 'Confirm account type change',
        description: `Change ${user.displayName} from ${user.role} to ${nextRole}. This updates what they can access on the platform.`,
        confirmLabel: 'Change account type',
        tone: 'danger',
      });
      if (!ok) return;
    }

    try {
      const payload: import('@/features/admin/api/adminApi').UpdateAdminUserPayload = {
        displayName: accountDraft.displayName ?? user.displayName,
        email: accountDraft.email ?? user.email,
        phone:
          accountDraft.phone !== undefined
            ? accountDraft.phone.trim() || null
            : user.phone,
        membershipTier: (accountDraft.membershipTier ?? user.membershipTier) as 'standard' | 'pro',
      };

      if (roleChanged) {
        payload.role = nextRole;
        if (nextOrganization.trim()) payload.organization = nextOrganization.trim();
        if (accountDraft.title?.trim() || coachDraft.title?.trim()) {
          payload.title = (accountDraft.title ?? coachDraft.title)?.trim();
        }
      }

      await updateUser.mutateAsync({ userId: id, payload });
      toast.success(roleChanged ? 'Account type updated.' : 'Account updated.');
      setAccountDraft({});
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update account'));
    }
  }

  async function saveCoachProfile() {
    if (!id) return;
    try {
      await updateCoach.mutateAsync({
        userId: id,
        payload: {
          title: coachDraft.title ?? coachProfile?.title ?? undefined,
          organization: coachDraft.organization ?? coachProfile?.organization ?? undefined,
          bio: coachDraft.bio ?? coachProfile?.bio ?? undefined,
          phone: coachDraft.phone ?? coachProfile?.phone ?? undefined,
          timezone: coachDraft.timezone ?? coachProfile?.timezone ?? undefined,
        },
      });
      toast.success('Coach profile updated.');
      setCoachDraft({});
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update coach profile'));
    }
  }

  async function handleResetPassword() {
    if (!id || !user) return;
    const ok = await confirm({
      title: 'Email a new password?',
      description: `${user.displayName} will receive a new temporary password by email. All active sessions will be signed out.`,
      confirmLabel: 'Send reset email',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const result = await resetPassword.mutateAsync({
        userId: id,
        sendEmail: true,
      });
      toast.success(
        result.emailSent
          ? 'Password reset email sent.'
          : 'Password was reset.',
        'Password reset',
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not reset password'));
    }
  }

  async function handleToggleActive() {
    if (!id || !user) return;
    const next = !user.isActive;
    const ok = await confirm({
      title: next ? 'Activate account?' : 'Deactivate account?',
      description: next
        ? `${user.displayName} will be able to sign in again.`
        : `${user.displayName} will be blocked from signing in.`,
      confirmLabel: next ? 'Activate' : 'Deactivate',
      tone: next ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      await updateUser.mutateAsync({ userId: id, payload: { isActive: next } });
      toast.success(next ? 'Account activated.' : 'Account deactivated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update account status'));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ash-grey-500">Loading user profile…</p>;
  }

  if (isError || !data || !user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Unable to load this user.</p>
        <Button variant="outline" onClick={() => navigate(ADMIN_ROUTES.users)}>
          Back to users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={user.displayName}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={ADMIN_ROUTES.users}>
              <Button variant="outline" size="sm">
                Back to users
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowAccountPanel((v) => !v)}>
              {showAccountPanel ? 'Hide account settings' : 'Account settings'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={user.role === 'admin'}
              onClick={() => void handleToggleActive()}>
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={resetPassword.isPending}
              onClick={() => void handleResetPassword()}>
              {resetPassword.isPending ? 'Sending…' : 'Email new password'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={user.isActive ? 'good' : 'warn'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
        <StatusPill tone="info">
          {USER_ROLE_OPTIONS.find((option) => option.value === user.role)?.label ?? user.role}
        </StatusPill>
        <StatusPill tone={tierTone(user.membershipTier)}>
          {user.membershipTier === 'pro' ? 'Pro · priority reviews' : 'Standard'}
        </StatusPill>
        {data.consumerProfile ? (
          <StatusPill tone="muted">Patient {data.consumerProfile.patientId}</StatusPill>
        ) : null}
      </div>

      <KpiStrip
        items={[
          { label: 'Meals logged', value: data.stats.meals.total },
          { label: 'In review', value: data.stats.meals.inReview, warn: data.stats.meals.inReview > 0 },
          { label: 'Approved', value: data.stats.meals.approved },
          { label: 'Referrals', value: data.stats.referralCount },
          {
            label: 'Member since',
            value: new Date(user.createdAt).toLocaleDateString(),
          },
        ]}
      />

      {isPatient && id && data.consumerProfile ? (
        <AdminPatientProfileView userId={id} patientId={data.consumerProfile.patientId} />
      ) : null}

      {showAccountPanel ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <DashboardPanel
            title="Account"
            action={
              <Button size="sm" disabled={updateUser.isPending} onClick={() => void saveAccount()}>
                Save account
              </Button>
            }>
            <div className="space-y-4 px-3 py-3 sm:px-4">
              <TextField
                label="Display name"
                value={accountDraft.displayName ?? user.displayName}
                onChange={(e) => setAccountDraft((prev) => ({ ...prev, displayName: e.target.value }))}
              />
              <TextField
                label="Email"
                type="email"
                value={accountDraft.email ?? user.email}
                onChange={(e) => setAccountDraft((prev) => ({ ...prev, email: e.target.value }))}
              />
              <PhoneField
                label="Phone"
                value={accountDraft.phone ?? user.phone ?? ''}
                onChange={(phone) => setAccountDraft((prev) => ({ ...prev, phone }))}
              />
              <div>
                <FieldLabel>Account type</FieldLabel>
                <Select
                  aria-label="Account type"
                  value={accountDraft.role ?? user.role}
                  onChange={(next) => setAccountDraft((prev) => ({ ...prev, role: next }))}
                  options={USER_ROLE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>
              {roleRequiresOrganization(
                accountDraft.role ?? user.role,
                coachProfile?.organization ?? accountDraft.organization,
              ) || isCoachRole(accountDraft.role ?? user.role) ? (
                <TextField
                  label="Organization"
                  required={roleRequiresOrganization(
                    accountDraft.role ?? user.role,
                    coachProfile?.organization,
                  )}
                  value={
                    accountDraft.organization ??
                    coachDraft.organization ??
                    coachProfile?.organization ??
                    ''
                  }
                  onChange={(e) =>
                    setAccountDraft((prev) => ({ ...prev, organization: e.target.value }))
                  }
                />
              ) : null}
              <div>
                <FieldLabel>Membership tier</FieldLabel>
                <Select
                  aria-label="Membership tier"
                  value={accountDraft.membershipTier ?? user.membershipTier}
                  onChange={(next) =>
                    setAccountDraft((prev) => ({
                      ...prev,
                      membershipTier: next as 'standard' | 'pro',
                    }))
                  }
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'pro', label: 'Pro (priority reviews)' },
                  ]}
                />
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Account metadata">
            <dl className="grid gap-3 px-3 py-3 text-sm sm:px-4">
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
              <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-4 py-3 text-ash-grey-600">
                Use <strong className="text-ash-grey-800">Email new password</strong> above to send a
                temporary password. The user is signed out everywhere automatically.
              </div>
            </dl>
          </DashboardPanel>
        </div>
      ) : null}

      {(user.role === 'coach' || user.role === 'nutrition_coach' || coachProfile) && (
        <DashboardPanel
          title="Coach profile"
          action={
            <Button size="sm" disabled={updateCoach.isPending} onClick={() => void saveCoachProfile()}>
              Save coach profile
            </Button>
          }>
          <div className="grid gap-4 px-3 py-3 sm:grid-cols-2 sm:px-4">
            <TextField
              label="Title"
              value={coachDraft.title ?? coachProfile?.title ?? ''}
              onChange={(e) => setCoachDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              label="Organization"
              value={coachDraft.organization ?? coachProfile?.organization ?? ''}
              onChange={(e) => setCoachDraft((prev) => ({ ...prev, organization: e.target.value }))}
            />
            <TextField
              label="Phone"
              value={coachDraft.phone ?? coachProfile?.phone ?? ''}
              onChange={(e) => setCoachDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <TextField
              label="Timezone"
              value={coachDraft.timezone ?? coachProfile?.timezone ?? ''}
              onChange={(e) => setCoachDraft((prev) => ({ ...prev, timezone: e.target.value }))}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Bio"
                value={coachDraft.bio ?? coachProfile?.bio ?? ''}
                onChange={(e) => setCoachDraft((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>
        </DashboardPanel>
      )}

      {confirmDialog}
    </div>
  );
}
