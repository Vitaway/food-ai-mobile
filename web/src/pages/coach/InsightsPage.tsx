import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/context/ToastContext';
import {
  createCoachInsight,
  fetchClients,
  fetchCoachAuthoredInsights,
  type CoachAuthoredInsight,
} from '@/api/coachApi';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatRelativeTime } from '@/lib/utils';

const TYPE_OPTIONS = [
  { id: 'coach_note', label: 'Coach note' },
  { id: 'tip', label: 'Tip' },
  { id: 'reminder', label: 'Reminder' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'trend', label: 'Trend' },
] as const;

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All types' },
  ...TYPE_OPTIONS.map((option) => ({ value: option.id, label: option.label })),
];

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((option) => option.id === type)?.label ?? type.replaceAll('_', ' ');
}

function typeTone(type: string): 'muted' | 'info' | 'warn' | 'good' | 'bad' {
  switch (type) {
    case 'tip':
      return 'info';
    case 'reminder':
      return 'warn';
    case 'celebration':
      return 'good';
    case 'trend':
      return 'info';
    default:
      return 'muted';
  }
}

export function InsightsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ['coach', 'clients'],
    queryFn: () => fetchClients(),
  });
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['coach', 'insights'],
    queryFn: fetchCoachAuthoredInsights,
  });

  const [composeOpen, setComposeOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<string>('coach_note');

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clients) {
      map.set(client.patientId, client.profile.displayName ?? 'Client');
    }
    return map;
  }, [clients]);

  const clientFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All clients' },
      ...clients.map((client) => ({
        value: client.patientId,
        label: client.profile.displayName ?? client.patientId,
      })),
    ],
    [clients],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return insights.filter((insight) => {
      if (clientFilter !== 'all' && insight.clientId !== clientFilter) return false;
      if (typeFilter !== 'all' && insight.type !== typeFilter) return false;
      if (!q) return true;
      const clientName = (clientNameById.get(insight.clientId) ?? '').toLowerCase();
      return (
        insight.title.toLowerCase().includes(q) ||
        insight.body.toLowerCase().includes(q) ||
        clientName.includes(q) ||
        typeLabel(insight.type).toLowerCase().includes(q)
      );
    });
  }, [insights, search, clientFilter, typeFilter, clientNameById]);

  function resetCompose() {
    setClientId('');
    setTitle('');
    setBody('');
    setType('coach_note');
  }

  function closeCompose() {
    if (createMutation.isPending) return;
    setComposeOpen(false);
    resetCompose();
  }

  const createMutation = useMutation({
    mutationFn: createCoachInsight,
    onSuccess: () => {
      toast.success('Insight sent to the patient.');
      void qc.invalidateQueries({ queryKey: ['coach', 'insights'] });
      setComposeOpen(false);
      resetCompose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not send insight.'));
    },
  });

  const canSend =
    Boolean(clientId) &&
    title.trim().length >= 2 &&
    body.trim().length >= 3 &&
    !createMutation.isPending;

  const columns: DataTableColumn<CoachAuthoredInsight>[] = [
    {
      key: 'client',
      header: 'Client',
      className: 'min-w-[8rem]',
      cell: (row) => (
        <span className="font-semibold text-ash-grey-900">
          {clientNameById.get(row.clientId) ?? 'Client'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => <StatusPill tone={typeTone(row.type)}>{typeLabel(row.type)}</StatusPill>,
    },
    {
      key: 'title',
      header: 'Title',
      className: 'min-w-[10rem] max-w-[16rem]',
      cell: (row) => (
        <span className="font-medium text-ash-grey-900" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      className: 'min-w-[14rem] max-w-[28rem]',
      cell: (row) => (
        <span className="line-clamp-2 text-ash-grey-700" title={row.body}>
          {row.body}
        </span>
      ),
    },
    {
      key: 'sent',
      header: 'Sent',
      className: 'whitespace-nowrap',
      cell: (row) => (
        <span className="text-xs text-ash-grey-500" title={new Date(row.createdAt).toLocaleString()}>
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'read',
      header: 'Read',
      cell: (row) =>
        row.readAt ? (
          <StatusPill tone="good">Read</StatusPill>
        ) : (
          <StatusPill tone="muted">Unread</StatusPill>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-ash-grey-900">
            Insights
          </h1>
          <p className="mt-1 text-sm text-ash-grey-500">
            Send personalized tips and notes that appear on the patient’s Insights tab and home feed.
          </p>
        </div>
        <Button variant="primary" onClick={() => setComposeOpen(true)}>
          New insight
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          className="min-w-0 flex-1"
          placeholder="Search title, message, or client…"
          value={search}
          onValueChange={setSearch}
        />
        <Select
          aria-label="Filter by client"
          variant="filter"
          size="sm"
          className="w-full lg:w-52"
          value={clientFilter}
          onChange={setClientFilter}
          options={clientFilterOptions}
        />
        <Select
          aria-label="Filter by type"
          variant="filter"
          size="sm"
          className="w-full lg:w-44"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_FILTER_OPTIONS}
        />
      </div>

      <DashboardPanel
        title="Sent insights"
        action={
          !isLoading ? (
            <span className="text-xs font-semibold text-ash-grey-500">
              {filtered.length} of {insights.length}
            </span>
          ) : null
        }
        bodyClassName="p-0">
        {isLoading ? (
          <p className="px-4 py-8 text-sm text-ash-grey-500">Loading insights…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            emptyTitle={insights.length === 0 ? 'No insights sent yet' : 'No insights match'}
            emptyDescription={
              insights.length === 0
                ? 'Tap New insight to send your first tip or note.'
                : 'Try another search or clear the filters.'
            }
          />
        )}
      </DashboardPanel>

      <Modal
        open={composeOpen}
        onClose={closeCompose}
        title="New insight"
        description="This note appears on the patient’s Insights tab and home coaching feed."
        size="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeCompose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canSend}
              onClick={() =>
                createMutation.mutate({
                  clientId,
                  title: title.trim(),
                  body: body.trim(),
                  type,
                })
              }>
              {createMutation.isPending ? 'Sending…' : 'Send insight'}
            </Button>
          </div>
        }>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Client
              </span>
              <select
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={createMutation.isPending}>
                <option value="">Select a client…</option>
                {clients.map((client) => (
                  <option key={client.patientId} value={client.patientId}>
                    {client.profile.displayName ?? client.patientId}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Type
              </span>
              <select
                className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={createMutation.isPending}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Title
            </span>
            <input
              className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great protein consistency this week"
              maxLength={160}
              disabled={createMutation.isPending}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Message
            </span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a short, actionable note for your patient…"
              disabled={createMutation.isPending}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
