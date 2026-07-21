import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { useCoachClients } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { formatCoachPatientLabel, formatRelativeTime } from '@/lib/utils';
import type { CoachClient } from '@/types';

const TREND_TONE = {
  improving: 'good',
  declining: 'bad',
  stable: 'muted',
} as const;

type ClientFilter =
  | 'all'
  | 'needs_review'
  | 'has_messages'
  | 'has_flags'
  | 'improving'
  | 'declining'
  | 'stable';

const CLIENT_FILTERS: { value: ClientFilter; label: string }[] = [
  { value: 'all', label: 'All clients' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'has_messages', label: 'Unread messages' },
  { value: 'has_flags', label: 'Open flags' },
  { value: 'improving', label: 'Improving' },
  { value: 'declining', label: 'Declining' },
  { value: 'stable', label: 'Stable' },
];

function matchesClientFilter(client: CoachClient, filter: ClientFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'needs_review') return (client.inReviewCount ?? 0) > 0;
  if (filter === 'has_messages') return (client.unreadMessages ?? 0) > 0;
  if (filter === 'has_flags') return (client.openFlags ?? 0) > 0;
  const trend = client.adherenceTrend ?? 'stable';
  return trend === filter;
}

export function ClientsPage() {
  const navigate = useNavigate();
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: clients, isLoading } = useCoachClients(cohortId ?? undefined);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(clients ?? [])]
      .filter((client) => matchesClientFilter(client, filter))
      .filter((client) => {
        if (!q) return true;
        const name = client.profile.displayName?.toLowerCase() ?? '';
        const id = client.patientId?.toLowerCase() ?? '';
        return name.includes(q) || id.includes(q);
      })
      .sort((a, b) => {
        const aReview = a.inReviewCount ?? 0;
        const bReview = b.inReviewCount ?? 0;
        if (bReview !== aReview) return bReview - aReview;
        const aTime = a.lastMealAt ? new Date(a.lastMealAt).getTime() : 0;
        const bTime = b.lastMealAt ? new Date(b.lastMealAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [clients, filter, search]);

  const summary = useMemo(() => {
    const list = clients ?? [];
    return {
      total: list.length,
      needsReview: list.filter((c) => (c.inReviewCount ?? 0) > 0).length,
      messages: list.filter((c) => (c.unreadMessages ?? 0) > 0).length,
      flags: list.filter((c) => (c.openFlags ?? 0) > 0).length,
      declining: list.filter((c) => (c.adherenceTrend ?? 'stable') === 'declining').length,
    };
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
      <DashboardPageHeader title="Clients" />

      <KpiStrip
        columns={5}
        items={[
          { label: 'Caseload', value: summary.total, tone: 'info', caption: 'Active patients' },
          {
            label: 'Needs review',
            value: summary.needsReview,
            tone: 'accent',
            warn: summary.needsReview > 0,
            caption: 'Meals waiting',
          },
          {
            label: 'Unread msgs',
            value: summary.messages,
            tone: 'default',
            warn: summary.messages > 0,
            caption: 'Open chats',
          },
          {
            label: 'Open flags',
            value: summary.flags,
            tone: 'warn',
            warn: summary.flags > 0,
            caption: 'Risk signals',
          },
          {
            label: 'Declining',
            value: summary.declining,
            tone: 'warn',
            warn: summary.declining > 0,
            caption: 'Adherence trend',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search patient ID or name…"
          value={search}
          onValueChange={setSearch}
        />
        <Select
          aria-label="Filter clients"
          variant="filter"
          size="sm"
          className="w-full sm:w-48"
          value={filter}
          onChange={(value) => setFilter(value as ClientFilter)}
          options={CLIENT_FILTERS}
        />
        <CohortFilter />
      </div>

      <DashboardPanel title="Caseload">
        {isLoading ? (
          <p className="px-3 py-8 text-sm text-ash-grey-500">Loading clients…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(c) => c.patientId}
            onRowClick={(c) => navigate(`/coach/clients/${c.patientId}`)}
            emptyTitle="No patients match"
            emptyDescription="Try another search or filter, or add patients from the review queue."
          />
        )}
      </DashboardPanel>
    </div>
  );
}
