import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField, TextField, FieldLabel } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import {
  useCreateAdminUser,
  useCreateOrganization,
  useOrganization,
  useOrganizationMetrics,
  useOrganizations,
  useUpdateAdminUser,
  useUpdateOrganization,
  useAdminUsers,
} from '@/features/admin/hooks/useAdminQueries';
import {
  selectIsOrganizationAdmin,
  selectIsPlatformAdmin,
  useAuthStore,
} from '@/features/auth/stores/authStore';
import { useToast } from '@/context/ToastContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiErrors';
import type {
  AdminOrganization,
  AdminOrganizationDetail,
  CreateAdminUserPayload,
} from '@/features/admin/api/adminApi';

const EMPTY_FORM = {
  name: '',
  status: 'active' as 'active' | 'inactive',
  contactEmail: '',
  contactPhone: '',
  notes: '',
};

const EMPTY_MEMBER_FORM = {
  role: 'consumer' as 'consumer' | 'coach' | 'nutrition_coach' | 'organization_admin',
  displayName: '',
  email: '',
  title: '',
};

type OrgMember = AdminOrganizationDetail['members'][number];
type AttachKind = 'consumer' | 'coach';
type InviteCredentials = {
  email: string;
  displayName: string;
  temporaryPassword: string;
  emailSent: boolean;
};

export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const isPlatformAdmin = useAuthStore(selectIsPlatformAdmin);
  const isOrgAdmin = useAuthStore(selectIsOrganizationAdmin);
  const sessionOrgId = useAuthStore((s) => s.session?.user.organizationId ?? null);
  const sessionUserId = useAuthStore((s) => s.session?.user.id ?? null);

  const { data: organizations = [], isLoading } = useOrganizations();
  const { data: detail, isLoading: detailLoading } = useOrganization(id ?? null);
  const { data: orgMetrics } = useOrganizationMetrics(id ?? null);
  const { data: allUsers = [] } = useAdminUsers();
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();

  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [attachKind, setAttachKind] = useState<AttachKind>('coach');
  const [attachUserId, setAttachUserId] = useState('');
  const [inviteCredentials, setInviteCredentials] = useState<InviteCredentials | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);

  useEffect(() => {
    if (!detail) return;
    setEditForm({
      name: detail.name,
      status: detail.status === 'inactive' ? 'inactive' : 'active',
      contactEmail: detail.contactEmail ?? '',
      contactPhone: detail.contactPhone ?? '',
      notes: detail.notes ?? '',
    });
  }, [detail]);

  const columns: DataTableColumn<AdminOrganization>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Organization',
        cell: (row) => (
          <div>
            <p className="font-semibold text-ash-grey-900">{row.name}</p>
            <p className="text-xs text-ash-grey-500">{row.contactEmail || 'No contact email'}</p>
          </div>
        ),
      },
      {
        key: 'members',
        header: 'Members',
        cell: (row) => <span className="text-ash-grey-700">{row.memberCount}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => (
          <StatusPill tone={row.status === 'active' ? 'good' : 'muted'}>{row.status}</StatusPill>
        ),
      },
      {
        key: 'updated',
        header: 'Updated',
        cell: (row) => (
          <span className="text-ash-grey-600">{new Date(row.updatedAt).toLocaleDateString()}</span>
        ),
      },
    ],
    [],
  );

  const attachableUsers = useMemo(() => {
    if (!detail) return [];
    return allUsers.filter((user) => {
      if (!user.isActive || user.organizationId === detail.id) return false;
      if (attachKind === 'coach') {
        return user.role === 'coach' || user.role === 'nutrition_coach';
      }
      return user.role === 'consumer';
    });
  }, [allUsers, detail, attachKind]);

  const attachOptions = useMemo(
    () =>
      attachableUsers.map((user) => ({
        value: user.id,
        label: user.organization
          ? `${user.displayName} · currently ${user.organization}`
          : `${user.displayName} · unassigned`,
      })),
    [attachableUsers],
  );

  // Org admins landing on the list should go straight to their org.
  if (!id && isOrgAdmin && sessionOrgId) {
    return <Navigate to={ADMIN_ROUTES.organizationDetail(sessionOrgId)} replace />;
  }
  if (!id && isOrgAdmin && !sessionOrgId && !isLoading && organizations.length === 1) {
    return <Navigate to={ADMIN_ROUTES.organizationDetail(organizations[0].id)} replace />;
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Organization name is required.');
      return;
    }
    try {
      const org = await createOrg.mutateAsync({
        name: form.name.trim(),
        status: form.status,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Organization created.');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      navigate(ADMIN_ROUTES.organizationDetail(org.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create organization'));
    }
  }

  async function handleSaveDetail() {
    if (!id) return;
    try {
      await updateOrg.mutateAsync({
        id,
        payload: {
          name: isPlatformAdmin ? editForm.name.trim() : undefined,
          status: isPlatformAdmin ? editForm.status : undefined,
          contactEmail: editForm.contactEmail.trim() || null,
          contactPhone: editForm.contactPhone.trim() || null,
          notes: editForm.notes.trim() || null,
        },
      });
      toast.success('Organization updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update organization'));
    }
  }

  async function handleAddMember() {
    if (!detail) return;
    if (!memberForm.displayName.trim() || !memberForm.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    if (memberForm.role === 'organization_admin' && !isPlatformAdmin) {
      toast.error('Only platform admins can add organization admins.');
      return;
    }

    try {
      const payload: CreateAdminUserPayload = {
        email: memberForm.email.trim(),
        displayName: memberForm.displayName.trim(),
        role: memberForm.role,
        organizationId: detail.id,
        organization: detail.name,
        registrationSource: 'admin_created',
        sendInviteEmail: true,
      };
      if (
        (memberForm.role === 'coach' || memberForm.role === 'nutrition_coach') &&
        memberForm.title.trim()
      ) {
        payload.title = memberForm.title.trim();
      }

      const result = await createUser.mutateAsync(payload);
      setShowAddMember(false);
      setMemberForm(EMPTY_MEMBER_FORM);

      if (result.temporaryPassword) {
        setInviteCredentials({
          email: result.user.email,
          displayName: result.user.displayName,
          temporaryPassword: result.temporaryPassword,
          emailSent: result.emailSent,
        });
      } else {
        toast.success(
          result.emailSent ? 'Member invited by email.' : 'Member added to organization.',
          'Member added',
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add member'));
    }
  }

  async function handleAttachMember() {
    if (!detail || !attachUserId) {
      toast.error('Select someone to attach.');
      return;
    }
    try {
      await updateUser.mutateAsync({
        userId: attachUserId,
        payload: { organizationId: detail.id },
      });
      toast.success(
        attachKind === 'coach'
          ? `Coach added to ${detail.name}.`
          : `Patient added to ${detail.name}.`,
      );
      setShowAttach(false);
      setAttachUserId('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not attach member'));
    }
  }

  async function handleRemoveMember(member: OrgMember) {
    if (!detail) return;
    if (member.id === sessionUserId) {
      toast.error('You cannot remove yourself from the organization.');
      return;
    }
    if (member.role === 'organization_admin' && !isPlatformAdmin) {
      toast.error('Organization admins cannot remove other organization admins.');
      return;
    }

    const ok = await confirm({
      title: 'Remove from organization?',
      description: `${member.displayName} will become an individual account and lose access to ${detail.name}.`,
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await updateUser.mutateAsync({
        userId: member.id,
        payload: { organizationId: '' },
      });
      toast.success(`${member.displayName} removed from ${detail.name}.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove member'));
    }
  }

  if (id) {
    if (detailLoading) {
      return <p className="text-sm text-ash-grey-500">Loading organization…</p>;
    }
    if (!detail) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ash-grey-500">Organization not found.</p>
          <Link to={ADMIN_ROUTES.organizations}>
            <Button variant="outline" size="sm">
              Back to organizations
            </Button>
          </Link>
        </div>
      );
    }

    const patients = detail.members.filter((m) => m.role === 'consumer').length;
    const coaches = detail.members.filter(
      (m) => m.role === 'coach' || m.role === 'nutrition_coach',
    ).length;
    const admins = detail.members.filter((m) => m.role === 'organization_admin').length;

    const memberColumns: DataTableColumn<OrgMember>[] = [
      {
        key: 'member',
        header: 'Member',
        cell: (row) => (
          <button
            type="button"
            className="text-left"
            onClick={() => navigate(ADMIN_ROUTES.userDetail(row.id))}>
            <p className="font-semibold text-ash-grey-900">{row.displayName}</p>
            <p className="text-xs text-ash-grey-500">{row.email}</p>
          </button>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        cell: (row) => (
          <span className="capitalize text-ash-grey-700">{row.role.replaceAll('_', ' ')}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => (
          <StatusPill tone={row.isActive ? 'good' : 'warn'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusPill>
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(ADMIN_ROUTES.userDetail(row.id))}>
              Open
            </Button>
            {row.id !== sessionUserId &&
            !(row.role === 'organization_admin' && !isPlatformAdmin) ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={updateUser.isPending}
                onClick={() => void handleRemoveMember(row)}>
                Remove
              </Button>
            ) : null}
          </div>
        ),
      },
    ];

    const memberRoleOptions = [
      { value: 'consumer', label: 'Patient' },
      { value: 'coach', label: 'Coach' },
      { value: 'nutrition_coach', label: 'Nutrition coach' },
      ...(isPlatformAdmin
        ? [{ value: 'organization_admin', label: 'Organization admin' }]
        : []),
    ];

    return (
      <div className="space-y-5">
        {confirmDialog}
        <DashboardPageHeader
          title={detail.name}
          actions={
            <div className="flex flex-wrap gap-2">
              {isPlatformAdmin ? (
                <Link to={ADMIN_ROUTES.organizations}>
                  <Button variant="outline" size="sm">
                    Back to organizations
                  </Button>
                </Link>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => setShowAddMember(true)}>
                Add member
              </Button>
              {isPlatformAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAttachKind('coach');
                    setAttachUserId('');
                    setShowAttach(true);
                  }}>
                  Attach existing
                </Button>
              ) : null}
              <Button size="sm" disabled={updateOrg.isPending} onClick={() => void handleSaveDetail()}>
                Save changes
              </Button>
            </div>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <DashboardPanel title="Patients">
            <p className="px-4 py-3 text-2xl font-bold text-ash-grey-900">
              {orgMetrics?.members.patients ?? patients}
            </p>
          </DashboardPanel>
          <DashboardPanel title="Coaches">
            <p className="px-4 py-3 text-2xl font-bold text-ash-grey-900">
              {orgMetrics?.members.coaches ?? coaches}
            </p>
          </DashboardPanel>
          <DashboardPanel title="Org admins">
            <p className="px-4 py-3 text-2xl font-bold text-ash-grey-900">
              {orgMetrics?.members.orgAdmins ?? admins}
            </p>
          </DashboardPanel>
        </div>

        {orgMetrics ? (
          <KpiStrip
            columns={4}
            items={[
              {
                label: 'Meals in review',
                value: orgMetrics.meals.inReview,
                tone: 'accent',
                warn: orgMetrics.meals.inReview > 0,
                caption: `${orgMetrics.meals.analyzing} analyzing`,
              },
              {
                label: 'Meals this week',
                value: orgMetrics.meals.thisWeek,
                tone: 'info',
                caption: `${orgMetrics.meals.total} total logged`,
              },
              {
                label: 'Inactive patients',
                value: orgMetrics.patients.inactive,
                tone: 'warn',
                warn: orgMetrics.patients.inactive > 0,
                caption: 'No meal logged in 7 days',
              },
              {
                label: 'Unassigned patients',
                value: orgMetrics.patients.unassigned,
                tone: 'warn',
                warn: orgMetrics.patients.unassigned > 0,
                caption: 'No coach assigned',
              },
            ]}
          />
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <DashboardPanel title="Organization details">
            <div className="space-y-4 px-3 py-3 sm:px-4">
              <TextField
                label="Name"
                value={editForm.name}
                disabled={!isPlatformAdmin}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              {isPlatformAdmin ? (
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    aria-label="Status"
                    value={editForm.status}
                    onChange={(next) =>
                      setEditForm((prev) => ({ ...prev, status: next as 'active' | 'inactive' }))
                    }
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                  />
                </div>
              ) : null}
              <TextField
                label="Contact email"
                type="email"
                value={editForm.contactEmail}
                onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              />
              <TextField
                label="Contact phone"
                value={editForm.contactPhone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
              />
              <TextAreaField
                label="Notes"
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={`Members · ${detail.members.length}`}
            action={
              <Button size="sm" variant="outline" onClick={() => setShowAddMember(true)}>
                Add
              </Button>
            }>
            <DataTable
              columns={memberColumns}
              rows={detail.members}
              rowKey={(row) => row.id}
              emptyTitle="No members yet"
              emptyDescription="Invite patients or coaches to this organization."
            />
          </DashboardPanel>
        </div>

        <Modal
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          title="Add organization member"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancel
              </Button>
              <Button disabled={createUser.isPending} onClick={() => void handleAddMember()}>
                {createUser.isPending ? 'Adding…' : 'Add & invite'}
              </Button>
            </>
          }>
          <div className="space-y-3">
            <div>
              <FieldLabel>Account type</FieldLabel>
              <Select
                aria-label="Account type"
                value={memberForm.role}
                onChange={(next) =>
                  setMemberForm((prev) => ({
                    ...prev,
                    role: next as typeof EMPTY_MEMBER_FORM.role,
                  }))
                }
                options={memberRoleOptions}
              />
            </div>
            <TextField
              label="Full name"
              value={memberForm.displayName}
              onChange={(e) => setMemberForm((prev) => ({ ...prev, displayName: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              value={memberForm.email}
              onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {memberForm.role === 'coach' || memberForm.role === 'nutrition_coach' ? (
              <TextField
                label="Title (optional)"
                value={memberForm.title}
                onChange={(e) => setMemberForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            ) : null}
            <p className="text-xs text-ash-grey-500">
              They’ll be added to <span className="font-semibold">{detail.name}</span> and receive
              invite credentials by email when delivery succeeds.
            </p>
          </div>
        </Modal>

        <Modal
          open={showAttach}
          onClose={() => {
            setShowAttach(false);
            setAttachUserId('');
          }}
          title="Attach existing member"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAttach(false);
                  setAttachUserId('');
                }}>
                Cancel
              </Button>
              <Button
                disabled={updateUser.isPending || !attachUserId}
                onClick={() => void handleAttachMember()}>
                {updateUser.isPending ? 'Attaching…' : 'Attach to organization'}
              </Button>
            </>
          }>
          <div className="space-y-3">
            <div>
              <FieldLabel>Member type</FieldLabel>
              <Select
                aria-label="Member type"
                value={attachKind}
                onChange={(next) => {
                  setAttachKind(next as AttachKind);
                  setAttachUserId('');
                }}
                options={[
                  { value: 'coach', label: 'Coach' },
                  { value: 'consumer', label: 'Patient' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>{attachKind === 'coach' ? 'Coach' : 'Patient'}</FieldLabel>
              <Select
                aria-label={attachKind === 'coach' ? 'Coach' : 'Patient'}
                value={attachUserId}
                onChange={setAttachUserId}
                options={attachOptions}
                placeholder={
                  attachableUsers.length > 0
                    ? 'Select someone…'
                    : `No ${attachKind === 'coach' ? 'coaches' : 'patients'} available to attach`
                }
              />
            </div>
            <p className="text-xs text-ash-grey-500">
              Moves them into <span className="font-semibold">{detail.name}</span>. People already
              in this organization are not listed.
            </p>
          </div>
        </Modal>

        <Modal
          open={Boolean(inviteCredentials)}
          onClose={() => setInviteCredentials(null)}
          title="Share invite credentials"
          footer={
            <Button onClick={() => setInviteCredentials(null)}>Done</Button>
          }>
          {inviteCredentials ? (
            <div className="space-y-3">
              <p className="text-sm text-ash-grey-600">
                {inviteCredentials.emailSent
                  ? 'Invite email was sent. Credentials below are also available if they need a resend.'
                  : 'Invite email could not be delivered. Share these credentials securely.'}
              </p>
              <div className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-4 py-3 text-sm">
                <p>
                  <span className="text-ash-grey-500">Name:</span>{' '}
                  <span className="font-medium text-ash-grey-900">
                    {inviteCredentials.displayName}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="text-ash-grey-500">Email:</span>{' '}
                  <span className="font-medium text-ash-grey-900">{inviteCredentials.email}</span>
                </p>
                <p className="mt-1">
                  <span className="text-ash-grey-500">Temporary password:</span>{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-ash-grey-900">
                    {inviteCredentials.temporaryPassword}
                  </code>
                </p>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {confirmDialog}
      <DashboardPageHeader
        title="Organizations"
        actions={
          isPlatformAdmin ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              Add organization
            </Button>
          ) : null
        }
      />

      <DashboardPanel title="All organizations">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-ash-grey-500">Loading organizations…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={organizations}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(ADMIN_ROUTES.organizationDetail(row.id))}
            emptyTitle="No organizations yet"
            emptyDescription={
              isPlatformAdmin
                ? 'Create an organization, then add coaches and patients to it.'
                : 'Ask a platform admin to assign you to an organization.'
            }
          />
        )}
      </DashboardPanel>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add organization"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button disabled={createOrg.isPending} onClick={() => void handleCreate()}>
              Create
            </Button>
          </>
        }>
        <div className="space-y-3">
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            label="Contact email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
          />
          <TextField
            label="Contact phone"
            value={form.contactPhone}
            onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
          />
          <TextAreaField
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
