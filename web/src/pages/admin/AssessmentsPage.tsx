import { useMemo, useState } from 'react';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { FilterChip, StatusPill } from '@/components/ui/StatusPill';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { useAdminClinicalAssessments } from '@/features/admin/hooks/useAdminQueries';
import type { AdminClinicalAssessmentRow } from '@/features/admin/api/adminApi';

type Filter = 'all' | 'incomplete' | 'draft' | 'confirmed' | 'high';

export function AdminAssessmentsPage() {
  const { data, isLoading } = useAdminClinicalAssessments();
  const [filter, setFilter] = useState<Filter>('all');
  const rows = data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (filter === 'all') return true;
        if (filter === 'high') return row.risk === 'high';
        return row.status === filter;
      }),
    [rows, filter],
  );

  const columns: DataTableColumn<AdminClinicalAssessmentRow>[] = [
    {
      key: 'patient',
      header: 'Patient',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ash-grey-900">{row.displayName}</p>
          <p className="text-xs text-ash-grey-500">{row.clientId}</p>
        </div>
      ),
    },
    {
      key: 'coach',
      header: 'Coach',
      cell: (row) => row.assignedCoach ?? <span className="text-ash-grey-400">Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Assessment',
      cell: (row) => (
        <StatusPill
          tone={row.status === 'confirmed' ? 'good' : row.status === 'draft' ? 'warn' : 'bad'}>
          {row.status}
        </StatusPill>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      cell: (row) => (
        <StatusPill tone={row.targetStatus === 'confirmed' ? 'good' : 'warn'}>
          {row.targetStatus}
        </StatusPill>
      ),
    },
    {
      key: 'risk',
      header: 'Risk',
      cell: (row) => (
        <StatusPill tone={row.risk === 'high' ? 'bad' : row.risk === 'medium' ? 'warn' : 'good'}>
          {row.risk}
        </StatusPill>
      ),
    },
    {
      key: 'updated',
      header: 'Last updated',
      cell: (row) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : <span className="text-ash-grey-400">Never</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <DashboardPageHeader title="Clinical assessments" />
        <p className="-mt-4 text-sm text-ash-grey-600">
          Track coach-completed health profiles before personalized targets are confirmed.
        </p>
      </div>

      <DashboardPanel title="Assessment coverage">
        <div className="px-3 py-3">
          <KpiStrip
            items={[
              { label: 'Total patients', value: rows.length },
              { label: 'Incomplete', value: rows.filter((row) => row.status === 'incomplete').length },
              { label: 'Draft', value: rows.filter((row) => row.status === 'draft').length },
              { label: 'Confirmed', value: rows.filter((row) => row.status === 'confirmed').length },
              { label: 'High risk', value: rows.filter((row) => row.risk === 'high').length },
            ]}
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Workflow"
        action={
          <div className="flex flex-wrap gap-2">
            {(['all', 'incomplete', 'draft', 'confirmed', 'high'] as const).map((value) => (
              <FilterChip
                key={value}
                label={value === 'high' ? 'High risk' : value}
                active={filter === value}
                onClick={() => setFilter(value)}
              />
            ))}
          </div>
        }>
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading assessments…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.clientId}
            emptyTitle="No assessments match this filter"
          />
        )}
      </DashboardPanel>
    </div>
  );
}
