import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import {
  useEnsureModuleAccount,
  useModuleEntitlements,
  useSetModuleEntitlements,
} from '@/features/admin/hooks/useAdminQueries';
import type { ModuleDefinition, ModuleEntitlementAccount } from '@/features/admin/api/adminApi';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export function AdminModulesPage() {
  const { data, isLoading } = useModuleEntitlements();
  const setModules = useSetModuleEntitlements();
  const ensureAccount = useEnsureModuleAccount();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [editing, setEditing] = useState<ModuleEntitlementAccount | null>(null);
  const [draftModules, setDraftModules] = useState<string[]>([]);
  const [newOrg, setNewOrg] = useState('');

  const catalog = data?.catalog ?? [];
  const accounts = data?.accounts ?? [];

  function openEditor(account: ModuleEntitlementAccount) {
    setEditing(account);
    setDraftModules([...account.modules]);
  }

  function toggleModule(key: string) {
    setDraftModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleSave() {
    if (!editing) return;
    const ok = await confirm({
      title: 'Save module entitlements?',
      description: `Update which modules “${editing.organizationKey}” can use. This controls partner feature access.`,
      confirmLabel: 'Save entitlements',
    });
    if (!ok) return;
    try {
      await setModules.mutateAsync({
        organizationKey: editing.organizationKey,
        modules: draftModules,
      });
      toast.success('Module entitlements updated.');
      setEditing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save entitlements'));
    }
  }

  async function handleEnsure() {
    const key = newOrg.trim();
    if (!key) return;
    const ok = await confirm({
      title: 'Add organization account?',
      description: `Create entitlement defaults (Tracking + Coaching) for “${key}”.`,
      confirmLabel: 'Add account',
    });
    if (!ok) return;
    try {
      const account = await ensureAccount.mutateAsync(key);
      toast.success('Organization added.');
      setNewOrg('');
      openEditor(account);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add organization'));
    }
  }

  const columns: DataTableColumn<ModuleEntitlementAccount>[] = [
    {
      key: 'account',
      header: 'Account',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{row.organizationKey}</p>
          {!row.stored ? (
            <p className="text-xs text-ash-grey-500">Using defaults until saved</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'modules',
      header: 'Modules enabled',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.moduleLabels.length ? (
            row.moduleLabels.map((label) => (
              <StatusPill key={label} tone="info">
                {label}
              </StatusPill>
            ))
          ) : (
            <span className="text-ash-grey-400">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(row);
          }}>
          Edit modules
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Module entitlements" />

      <DashboardPanel title="The 6 modules">
        <div className="space-y-3 px-3 py-3">
          <p className="text-sm text-ash-grey-600">
            Think of each module as a separate switch. A gym never needs Claims; an insurer never
            needs Fulfillment. Combining switches per account means new partner types don’t require
            rebuilding permissions from scratch.
          </p>
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Module',
                cell: (m: ModuleDefinition) => (
                  <span className="font-semibold text-ash-grey-900">{m.name}</span>
                ),
              },
              {
                key: 'desc',
                header: 'Includes',
                cell: (m: ModuleDefinition) => (
                  <span className="text-ash-grey-700">{m.description}</span>
                ),
              },
              {
                key: 'audience',
                header: 'Typical audience',
                cell: (m: ModuleDefinition) => (
                  <span className="text-ash-grey-500">{m.defaultAudience}</span>
                ),
              },
            ]}
            rows={catalog}
            rowKey={(m) => m.key}
            emptyTitle="Catalog unavailable"
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Which accounts have which modules"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              placeholder="New organization name"
              className="min-w-[12rem] rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!newOrg.trim() || ensureAccount.isPending}
              onClick={() => void handleEnsure()}>
              Add account
            </Button>
          </div>
        }>
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading entitlements…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={accounts}
            rowKey={(r) => r.organizationKey}
            onRowClick={openEditor}
            emptyTitle="No organizations yet"
            emptyDescription="Organizations appear from coach profiles, billing orgs, or when you add one above."
          />
        )}
      </DashboardPanel>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Modules · ${editing.organizationKey}` : 'Modules'}
        description="Toggle the feature bundles this account is allowed to use."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={setModules.isPending}
              onClick={() => void handleSave()}>
              {setModules.isPending ? 'Saving…' : 'Save entitlements'}
            </Button>
          </div>
        }>
        <div className="space-y-3">
          {catalog.map((module) => {
            const checked = draftModules.includes(module.key);
            return (
              <label
                key={module.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-ash-grey-200 px-4 py-3 hover:bg-ash-grey-50">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ash-grey-300 text-blue-spruce-600 focus:ring-blue-spruce-400"
                  checked={checked}
                  onChange={() => toggleModule(module.key)}
                />
                <span>
                  <span className="block font-semibold text-ash-grey-900">{module.name}</span>
                  <span className="mt-0.5 block text-sm text-ash-grey-600">{module.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </Modal>

      {confirmDialog}
    </div>
  );
}
