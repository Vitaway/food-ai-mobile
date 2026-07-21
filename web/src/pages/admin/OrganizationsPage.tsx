import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField, TextField, FieldLabel } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { ADMIN_ROUTES } from '@/features/auth/constants';
import {
  useCreateOrganization,
  useOrganization,
  useOrganizations,
  useUpdateOrganization,
} from '@/features/admin/hooks/useAdminQueries';
import { useAuthStore, selectIsPlatformAdmin } from '@/features/auth/stores/authStore';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import type { AdminOrganization } from '@/features/admin/api/adminApi';

const EMPTY_FORM = {
  name: '',
  status: 'active' as 'active' | 'inactive',
  contactEmail: '',
  contactPhone: '',
  notes: '',
};

export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const toast = useToast();
  const isPlatformAdmin = useAuthStore(selectIsPlatformAdmin);
  const { data: organizations = [], isLoading } = useOrganizations();
  const { data: detail, isLoading: detailLoading } = useOrganization(id ?? null);
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

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

  if (id) {
    if (detailLoading || !detail) {
      return <p className="text-sm text-ash-grey-500">Loading organization…</p>;
    }

    return (
      <div className="space-y-5">
        <DashboardPageHeader
          title={detail.name}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link to={ADMIN_ROUTES.organizations}>
                <Button variant="outline" size="sm">
                  Back to organizations
                </Button>
              </Link>
              <Button size="sm" disabled={updateOrg.isPending} onClick={() => void handleSaveDetail()}>
                Save changes
              </Button>
            </div>
          }
        />

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

          <DashboardPanel title={`Members · ${detail.members.length}`}>
            <DataTable
              columns={[
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
                    <span className="capitalize text-ash-grey-700">
                      {row.role.replaceAll('_', ' ')}
                    </span>
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
              ]}
              rows={detail.members}
              rowKey={(row) => row.id}
              emptyTitle="No members yet"
            />
          </DashboardPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
