import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useCoachTeam } from '@/hooks/useCoachQueries';
import { cn } from '@/lib/utils';

export type SecondOpinionDestination = 'coach' | 'admin' | 'team';

type SecondOpinionModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    destination: SecondOpinionDestination;
    assigneeUserId?: string;
    note: string;
  }) => void;
};

const DESTINATIONS: {
  id: SecondOpinionDestination;
  title: string;
  description: string;
}[] = [
  {
    id: 'coach',
    title: 'Ask a coach',
    description: 'DM a teammate coach and assign them this meal for a second look.',
  },
  {
    id: 'admin',
    title: 'Ask an admin',
    description: 'Escalate to an admin with a direct message for senior follow-up.',
  },
  {
    id: 'team',
    title: 'Post in team chat',
    description: 'Share the request in your organization lounge so anyone can jump in.',
  },
];

function isCoachRole(role?: string | null) {
  return role === 'coach' || role === 'nutrition_coach' || !role;
}

export function SecondOpinionModal({ open, loading, onClose, onSubmit }: SecondOpinionModalProps) {
  const { data: team, isLoading: teamLoading } = useCoachTeam();
  const [destination, setDestination] = useState<SecondOpinionDestination>('coach');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [note, setNote] = useState('');

  const people = useMemo(() => {
    const list = (team?.coaches ?? []).filter((m) => !m.isSelf);
    if (destination === 'admin') return list.filter((m) => m.role === 'admin');
    if (destination === 'coach') return list.filter((m) => isCoachRole(m.role));
    return [];
  }, [team?.coaches, destination]);

  function handleDestinationChange(next: SecondOpinionDestination) {
    setDestination(next);
    setAssigneeUserId('');
  }

  function handleSubmit() {
    if (destination !== 'team' && !assigneeUserId) return;
    onSubmit({
      destination,
      assigneeUserId: destination === 'team' ? undefined : assigneeUserId,
      note: note.trim(),
    });
  }

  const needsPerson = destination === 'coach' || destination === 'admin';
  const canSubmit =
    !loading &&
    (!needsPerson || Boolean(assigneeUserId)) &&
    !(needsPerson && people.length === 0 && !teamLoading);

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Second opinion"
      description="Get another set of eyes on this meal — pick who should help."
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      }>
      <div className="space-y-5">
        <div className="grid gap-2">
          {DESTINATIONS.map((option) => {
            const selected = destination === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleDestinationChange(option.id)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-blue-spruce-500 bg-blue-spruce-50 ring-2 ring-blue-spruce-100'
                    : 'border-ash-grey-200 bg-white hover:border-ash-grey-300 hover:bg-ash-grey-50',
                )}>
                <p className="text-sm font-semibold text-ash-grey-900">{option.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ash-grey-500">{option.description}</p>
              </button>
            );
          })}
        </div>

        {needsPerson ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ash-grey-700">
              {destination === 'admin' ? 'Choose admin' : 'Choose coach'}
            </label>
            {teamLoading ? (
              <p className="text-sm text-ash-grey-500">Loading team…</p>
            ) : people.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                {destination === 'admin'
                  ? 'No admins are on your team roster yet.'
                  : 'No other coaches are on your team roster yet. Try team chat instead.'}
              </p>
            ) : (
              <Select
                aria-label={destination === 'admin' ? 'Admin' : 'Coach'}
                value={assigneeUserId}
                onChange={setAssigneeUserId}
                placeholder={destination === 'admin' ? 'Select an admin…' : 'Select a coach…'}
                options={people.map((m) => ({
                  value: m.coachUserId,
                  label: `${m.displayName}${m.title ? ` · ${m.title}` : ''}`,
                }))}
              />
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-blue-spruce-100 bg-blue-spruce-50 px-3 py-2.5 text-sm text-blue-spruce-800">
            This posts to your organization team chat (Coach lounge) with a link to this meal.
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ash-grey-700">
            Note <span className="font-normal text-ash-grey-400">(optional)</span>
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
            placeholder={
              destination === 'team'
                ? 'What should the team look at?'
                : 'What should they double-check?'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
