import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAdminSystem, useAuditLogs } from '@/features/admin/hooks/useAdminQueries';
import type { AuditLogEntry } from '@/features/admin/api/adminApi';

export function AdminSystemPage() {
  const { data: system, isLoading } = useAdminSystem();
  const { data: audit } = useAuditLogs();

  const readiness = system as
    | {
        readiness?: { checks?: { database?: boolean; redis?: boolean } };
        anthropic?: { apiKeyStatus?: string; model?: string };
      }
    | undefined;

  const auditColumns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'when',
      header: 'When',
      cell: (entry) => (
        <span className="text-ash-grey-600">{new Date(entry.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (entry) => <span className="font-semibold text-ash-grey-900">{entry.action}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      cell: (entry) => (
        <span className="text-ash-grey-600">
          {entry.targetType ?? '—'}
          {entry.targetId ? ` · ${entry.targetId}` : ''}
        </span>
      ),
    },
    {
      key: 'meta',
      header: 'Details',
      cell: (entry) => (
        <span className="text-xs text-ash-grey-500">
          {entry.meta ? JSON.stringify(entry.meta).slice(0, 80) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="System & audit" />

      {isLoading ? (
        <p className="text-ash-grey-500">Loading system status…</p>
      ) : readiness ? (
        <KpiStrip
          items={[
            {
              label: 'Database',
              value: readiness.readiness?.checks?.database ? 'Healthy' : 'Check',
              warn: !readiness.readiness?.checks?.database,
            },
            {
              label: 'Redis',
              value: readiness.readiness?.checks?.redis ? 'Healthy' : 'Check',
              warn: !readiness.readiness?.checks?.redis,
            },
            {
              label: 'Claude (Anthropic)',
              value:
                readiness.anthropic?.apiKeyStatus === 'configured' ? 'Configured' : 'Missing',
              warn: readiness.anthropic?.apiKeyStatus !== 'configured',
              caption: readiness.anthropic?.model ?? readiness.anthropic?.apiKeyStatus,
            },
          ]}
        />
      ) : null}

      <DashboardPanel
        title="Audit log"
        action={
          audit?.length ? (
            <StatusPill tone="muted">{audit.length} entries</StatusPill>
          ) : null
        }>
        <DataTable
          columns={auditColumns}
          rows={audit ?? []}
          rowKey={(e) => e.id}
          emptyTitle="No audit entries yet"
          emptyDescription="Admin actions will appear here as they happen."
        />
      </DashboardPanel>
    </div>
  );
}
