import { useMemo, useState } from 'react';
import type { ChatContact } from '@/api/chatApi';
import { Modal } from '@/components/ui/Modal';
import {
  useChatContacts,
  useEnsureDirectConversation,
  useEnsurePatientConversation,
  useUsers,
} from '@/hooks/useChatQueries';
import { cn } from '@/lib/utils';

type NewChatModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenConversation: (conversationId: string) => void;
};

const ROLE_LABELS: Record<string, string> = {
  coach: 'Coach',
  consumer: 'Patient',
  admin: 'Admin',
  data_entry_staff: 'Staff',
};

function ContactAvatar({ name, role }: { name: string; role: string }) {
  const isCoach = role === 'coach' || role === 'admin';
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        isCoach ? 'bg-blue-spruce-100 text-blue-spruce-800' : 'bg-shamrock-100 text-shamrock-800',
      )}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function NewChatModal({ open, onClose, onOpenConversation }: NewChatModalProps) {
  const [search, setSearch] = useState('');
  const [startingId, setStartingId] = useState<string | null>(null);

  const contactsQuery = useChatContacts(open);
  const usersQuery = useUsers(open && contactsQuery.isError);
  const contacts = contactsQuery.data ?? usersQuery.data;
  const isLoading = contactsQuery.isLoading || (contactsQuery.isError && usersQuery.isLoading);
  const isError = contactsQuery.isError && usersQuery.isError;

  const ensurePatient = useEnsurePatientConversation();
  const ensureDirect = useEnsureDirectConversation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.clientId?.toLowerCase().includes(q) ?? false),
    );
  }, [contacts, search]);

  async function handleSelect(contact: ChatContact) {
    if (startingId) return;

    if (contact.conversationId) {
      onOpenConversation(contact.conversationId);
      onClose();
      setSearch('');
      return;
    }

    setStartingId(contact.userId);
    try {
      const conv =
        contact.role === 'consumer' && contact.clientId
          ? await ensurePatient.mutateAsync({ clientId: contact.clientId })
          : await ensureDirect.mutateAsync(contact.userId);
      onOpenConversation(conv.id);
      onClose();
      setSearch('');
    } finally {
      setStartingId(null);
    }
  }

  function handleClose() {
    if (startingId) return;
    onClose();
    setSearch('');
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New chat"
      description="Select anyone in the platform to start a conversation."
      size="md">
      <div className="relative mb-4">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-grey-400"
          aria-hidden>
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role"
          autoFocus
          className="w-full rounded-xl border border-ash-grey-200 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ash-grey-400 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
        />
      </div>

      <div className="-mx-2 max-h-[min(420px,50vh)] overflow-y-auto">
        {isLoading ? (
          <p className="px-2 py-8 text-center text-sm text-ash-grey-500">Loading users…</p>
        ) : isError ? (
          <p className="px-2 py-8 text-center text-sm text-cinnamon-wood-600">
            Could not load users. Restart the API server and try again.
          </p>
        ) : filtered.length ? (
          <ul className="divide-y divide-ash-grey-100">
            {filtered.map((contact) => {
              const busy = startingId === contact.userId;
              return (
                <li key={contact.userId}>
                  <button
                    type="button"
                    disabled={Boolean(startingId)}
                    onClick={() => void handleSelect(contact)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-ash-grey-50',
                      busy && 'opacity-70',
                    )}>
                    <ContactAvatar name={contact.displayName} role={contact.role} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ash-grey-900">{contact.displayName}</p>
                      <p className="truncate text-xs text-ash-grey-500">
                        {ROLE_LABELS[contact.role] ?? contact.role} · {contact.email}
                      </p>
                    </div>
                    {contact.conversationId ? (
                      <span className="shrink-0 text-xs font-medium text-blue-spruce-600">Open chat</span>
                    ) : busy ? (
                      <span className="shrink-0 text-xs text-ash-grey-500">Starting…</span>
                    ) : (
                      <span className="shrink-0 text-xs text-ash-grey-400">New</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-2 py-8 text-center text-sm text-ash-grey-500">
            {search ? 'No users match your search.' : 'No users in the database yet.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
