import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useCoachClients } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { formatCoachPatientLabel, formatRelativeTime } from '@/lib/utils';
import type { CoachClient } from '@/types';

const TREND_TONE = {
  improving: 'good',
  declining: 'bad',
  stable: 'muted',
} as const;

export function ClientsPage() {
  const navigate = useNavigate();
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: clients, isLoading } = useCoachClients(cohortId ?? undefined);

  const sorted = useMemo(() => {
    return [...(clients ?? [])].sort((a, b) => {
      const aReview = a.inReviewCount ?? 0;
      const bReview = b.inReviewCount ?? 0;
      if (bReview !== aReview) return bReview - aReview;
      const aTime = a.lastMealAt ? new Date(a.lastMealAt).getTime() : 0;
      const bTime = b.lastMealAt ? new Date(b.lastMealAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [clients]);

  const columns: DataTableColumn<CoachClient>[] = [
    {
      key: 'client',
      header: 'Patient',
      cell: (client) => (
        <span className="font-semibold text-ash-grey-900">
          {formatCoachPatientLabel(client.patientId, client.profile.displayName)}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Health score',
      cell: (client) => (
        <span className="font-medium text-ash-grey-800">{client.dashboard.healthScore ?? 0}</span>
      ),
    },
    {
      key: 'adherence',
      header: 'Adherence',
      cell: (client) => {
        const trend = client.adherenceTrend ?? 'stable';
        return (
          <StatusPill tone={TREND_TONE[trend]}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
          </StatusPill>
        );
      },
    },
    {
      key: 'allergies',
      header: 'Allergies',
      cell: (client) => {
        const allergies = client.profile.allergies ?? [];
        if (!allergies.length) return <span className="text-ash-grey-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {allergies.slice(0, 2).map((a) => (
              <StatusPill key={a} tone="bad">
                {a}
              </StatusPill>
            ))}
            {allergies.length > 2 ? (
              <span className="text-xs text-ash-grey-400">+{allergies.length - 2}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'flags',
      header: 'Flags',
      cell: (client) => {
        const chips: ReactNode[] = [];
        if ((client.inReviewCount ?? 0) > 0) {
          chips.push(
            <StatusPill key="review" tone="warn">
              {client.inReviewCount} review
            </StatusPill>,
          );
        }
        if ((client.unreadMessages ?? 0) > 0) {
          chips.push(
            <StatusPill key="msg" tone="info">
              {client.unreadMessages} msg
            </StatusPill>,
          );
        }
        if ((client.openFlags ?? 0) > 0) {
          chips.push(
            <StatusPill key="flags" tone="bad">
              {client.openFlags} flag
            </StatusPill>,
          );
        }
        if (!chips.length) return <span className="text-ash-grey-400">—</span>;
        return <div className="flex flex-wrap gap-1">{chips}</div>;
      },
    },
    {
      key: 'last',
      header: 'Last log',
      cell: (client) => (
        <span className="text-ash-grey-600">
          {client.lastMealAt ? formatRelativeTime(client.lastMealAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'today',
      header: 'Today',
      cell: (client) => (
        <span className="text-ash-grey-600">
          {client.dashboard.caloriesConsumed} / {client.dashboard.calorieTarget} kcal
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DashboardPageHeader title="Clients" actions={<CohortFilter />} />

      <DashboardPanel title="Caseload">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading clients…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={sorted}
            rowKey={(c) => c.patientId}
            onRowClick={(c) => navigate(`/coach/clients/${c.patientId}`)}
            emptyTitle="No patients on your caseload yet"
            emptyDescription='Review meals from the queue and tap "Add to my caseload" when you take ownership.'
          />
        )}
      </DashboardPanel>
    </div>
  );
}
