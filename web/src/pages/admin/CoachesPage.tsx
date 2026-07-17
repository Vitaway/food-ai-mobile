import { useState } from 'react';
import { BanIcon, PlusIcon, RefreshIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import {
  useAdminCoaches,
  useAdminCoachRoster,
  useCreateCoach,
  useSetUserActive,
} from '@/features/admin/hooks/useAdminQueries';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { AdminCoach } from '@/features/admin/api/adminApi';

const DEFAULT_FORM = {
  email: '',
  password: '',
  displayName: '',
  title: 'Nutrition Coach',
  organization: 'Vitaway',
  bio: '',
};

export function AdminCoachesPage() {
  const { data: coaches, isLoading } = useAdminCoaches();
  const { data: roster } = useAdminCoachRoster();
  const createCoach = useCreateCoach();
  const setActive = useSetUserActive();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(DEFAULT_FORM.email);
  const [password, setPassword] = useState(DEFAULT_FORM.password);
  const [displayName, setDisplayName] = useState(DEFAULT_FORM.displayName);
  const [title, setTitle] = useState(DEFAULT_FORM.title);
  const [organization, setOrganization] = useState(DEFAULT_FORM.organization);
  const [bio, setBio] = useState(DEFAULT_FORM.bio);

  function closeForm() {
    setShowForm(false);
    setEmail(DEFAULT_FORM.email);
    setPassword(DEFAULT_FORM.password);
    setDisplayName(DEFAULT_FORM.displayName);
    setTitle(DEFAULT_FORM.title);
    setOrganization(DEFAULT_FORM.organization);
    setBio(DEFAULT_FORM.bio);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await confirm({
      title: 'Create coach account?',
      description: `${displayName.trim() || 'This coach'} will be able to sign in with the email and temporary password you entered.`,
      confirmLabel: 'Create account',
    });
    if (!ok) return;

    try {
      await createCoach.mutateAsync({
        email,
        password,
        displayName,
        title,
        organization,
        bio: bio || undefined,
      });
      toast.success('Coach account created successfully.', 'Coach added');
      closeForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create coach'), 'Could not create coach');
    }
  }

  async function toggleActive(coach: AdminCoach) {
    const activating = !coach.isActive;
    const ok = await confirm({
      title: activating ? 'Reactivate this coach?' : 'Deactivate this coach?',
      description: activating
        ? `${coach.displayName} will be able to sign in again.`
        : `${coach.displayName} will lose access until reactivated.`,
      confirmLabel: activating ? 'Reactivate' : 'Deactivate',
      tone: activating ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      await setActive.mutateAsync({ userId: coach.id, isActive: activating });
      toast.success(activating ? 'Coach reactivated.' : 'Coach deactivated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update coach'));
    }
  }

  const coachColumns: DataTableColumn<AdminCoach>[] = [
    {
      key: 'name',
      header: 'Coach',
      cell: (coach) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{coach.displayName}</p>
          <p className="text-xs text-ash-grey-500">{coach.email}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Role / org',
      cell: (coach) => (
        <span className="text-ash-grey-700">
          {coach.profile?.title ?? 'Coach'}
          {coach.profile?.organization ? ` · ${coach.profile.organization}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (coach) => (
        <StatusPill tone={coach.isActive ? 'good' : 'bad'}>
          {coach.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (coach) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={coach.isActive ? <BanIcon /> : <RefreshIcon />}
          disabled={setActive.isPending}
          onClick={(e) => {
            e.stopPropagation();
            void toggleActive(coach);
          }}>
          {coach.isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  type RosterRow = {
    id: string;
    displayName: string;
    email: string;
    assignedClients: number;
    correctionRate: number;
    avgTurnaroundHours: number;
    isActive: boolean;
  };

  const rosterColumns: DataTableColumn<RosterRow>[] = [
    {
      key: 'coach',
      header: 'Coach',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{row.displayName}</p>
          <p className="text-xs text-ash-grey-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'clients',
      header: 'Clients',
      cell: (row) => <span>{row.assignedClients}</span>,
    },
    {
      key: 'correction',
      header: 'Correction rate',
      cell: (row) => <span>{row.correctionRate}%</span>,
    },
    {
      key: 'turnaround',
      header: 'Avg turnaround',
      cell: (row) => <span>{row.avgTurnaroundHours}h</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusPill tone={row.isActive ? 'good' : 'bad'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Coaches"
        actions={
          <Button type="button" variant="primary" size="md" icon={<PlusIcon />} onClick={() => setShowForm(true)}>
            Add coach
          </Button>
        }
      />

      {roster?.length ? (
        <DashboardPanel title="Coach performance">
          <DataTable
            columns={rosterColumns}
            rows={roster as RosterRow[]}
            rowKey={(r) => r.id}
            emptyTitle="No performance data"
          />
        </DashboardPanel>
      ) : null}

      <DashboardPanel title="Coach accounts">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading coaches…</p>
        ) : (
          <DataTable
            columns={coachColumns}
            rows={coaches ?? []}
            rowKey={(c) => c.id}
            emptyTitle="No coaches yet"
            emptyDescription="Use Add coach to create the first account."
          />
        )}
      </DashboardPanel>

      <Modal
        open={showForm}
        onClose={closeForm}
        title="New coach account"
        description="Create a coach login with a temporary password. They can change it after signing in."
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-coach-form"
              variant="primary"
              disabled={createCoach.isPending}>
              {createCoach.isPending ? 'Creating…' : 'Create coach account'}
            </Button>
          </div>
        }>
        <form
          id="create-coach-form"
          onSubmit={(e) => void handleCreate(e)}
          className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Coach"
          />
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@example.com"
          />
          <TextField
            label="Temporary password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <TextField label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            label="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <div className="sm:col-span-2">
            <TextAreaField label="Bio (optional)" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </form>
      </Modal>

      {confirmDialog}
    </div>
  );
}
