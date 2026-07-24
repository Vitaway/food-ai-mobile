import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { useToast } from '@/context/ToastContext';
import {
  createCoachInsight,
  fetchClients,
  fetchCoachAuthoredInsights,
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

  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<string>('coach_note');

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clients) {
      map.set(client.patientId, client.profile.displayName ?? 'Client');
    }
    return map;
  }, [clients]);

  const createMutation = useMutation({
    mutationFn: createCoachInsight,
    onSuccess: () => {
      setTitle('');
      setBody('');
      toast.success('Insight sent to the patient.');
      void qc.invalidateQueries({ queryKey: ['coach', 'insights'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not send insight.'));
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-sans text-xl font-semibold tracking-tight text-ash-grey-900">Insights</h1>
        <p className="mt-1 text-sm text-ash-grey-500">
          Send personalized tips and notes that appear on the patient’s home screen.
        </p>
      </div>

      <DashboardPanel title="Compose insight" bodyClassName="space-y-3 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Client
            </span>
            <select
              className="w-full rounded-xl border border-ash-grey-200 px-3 py-2 text-sm outline-none focus:border-blue-spruce-400"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}>
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
              onChange={(e) => setType(e.target.value)}>
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
          />
        </label>
        <Button
          variant="secondary"
          disabled={!clientId || title.trim().length < 2 || body.trim().length < 3 || createMutation.isPending}
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
      </DashboardPanel>

      <DashboardPanel title="Recently sent" bodyClassName="px-4 py-3">
        {isLoading ? (
          <p className="text-sm text-ash-grey-500">Loading insights…</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-ash-grey-500">No insights sent yet.</p>
        ) : (
          <ul className="divide-y divide-ash-grey-100">
            {insights.map((insight) => (
              <li key={insight.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-ash-grey-900">{insight.title}</p>
                  <span className="text-xs text-ash-grey-500">
                    {formatRelativeTime(insight.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ash-grey-500">
                  {clientNameById.get(insight.clientId) ?? 'Client'} · {insight.type.replace('_', ' ')}
                </p>
                <p className="mt-1 text-sm text-ash-grey-700">{insight.body}</p>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </div>
  );
}
