import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChatThread } from '@/components/chat/ChatThread';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { TeamMembersModal } from '@/components/chat/TeamMembersModal';
import { Button } from '@/components/ui/Button';
import type { ChatConversation } from '@/api/chatApi';
import {
  useChatConversation,
  useChatConversations,
  useChatMessages,
  useEnsureTeamChannel,
} from '@/hooks/useChatQueries';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { cn, formatChatListTime } from '@/lib/utils';

type FilterTab = 'all' | 'patients' | 'team';

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cinnamon-wood-400 px-1.5 text-[11px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function ConversationAvatar({ conversation }: { conversation: ChatConversation }) {
  const initial =
    conversation.type === 'team'
      ? '👥'
      : conversation.title.slice(0, 1).toUpperCase();
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold',
        conversation.type === 'team'
          ? 'bg-blue-spruce-100 text-blue-spruce-700'
          : conversation.type === 'direct'
            ? 'bg-cinnamon-wood-100 text-cinnamon-wood-800'
            : 'bg-shamrock-100 text-shamrock-800',
      )}>
      {initial}
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: ChatConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const unread = conversation.unreadCount > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 border-b border-ash-grey-100 px-4 py-3 text-left transition-colors hover:bg-ash-grey-50',
        active && 'bg-blue-spruce-50/80',
      )}>
      <ConversationAvatar conversation={conversation} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('truncate text-[15px]', unread ? 'font-bold text-ash-grey-900' : 'font-medium text-ash-grey-800')}>
            {conversation.title}
          </p>
          {conversation.lastMessageAt ? (
            <span className={cn('shrink-0 text-xs', unread ? 'font-semibold text-blue-spruce-600' : 'text-ash-grey-400')}>
              {formatChatListTime(conversation.lastMessageAt)}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn('truncate text-sm', unread ? 'font-medium text-ash-grey-700' : 'text-ash-grey-500')}>
            {conversation.type === 'team' && conversation.memberCount != null
              ? `${conversation.memberCount} members`
              : (conversation.lastMessagePreview ?? 'No messages yet')}
          </p>
          <NavBadge count={conversation.unreadCount} />
        </div>
      </div>
    </button>
  );
}

function ChatPanel({ conversationId }: { conversationId: string }) {
  const [membersOpen, setMembersOpen] = useState(false);
  useChatRealtime(conversationId);
  const { data: conversation } = useChatConversation(conversationId);
  const { data: messages, isLoading } = useChatMessages(conversationId);

  const isTeam = conversation?.type === 'team';
  const memberLabel =
    isTeam && conversation?.memberCount != null
      ? `${conversation.memberCount} ${conversation.memberCount === 1 ? 'member' : 'members'}`
      : isTeam
        ? 'Team channel'
        : null;

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-ash-grey-200 bg-[#f0f2f5] px-4">
        {isTeam ? (
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:opacity-80">
            <ConversationAvatar
              conversation={
                conversation ?? {
                  id: conversationId,
                  type: 'team',
                  title: 'Team',
                  unreadCount: 0,
                  createdAt: '',
                }
              }
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-ash-grey-900">
                {conversation?.title ?? 'Team channel'}
              </h2>
              <p className="truncate text-xs text-ash-grey-500">{memberLabel ?? 'Tap for group info'}</p>
            </div>
          </button>
        ) : (
          <>
            <ConversationAvatar
              conversation={
                conversation ?? {
                  id: conversationId,
                  type: 'patient',
                  title: 'Chat',
                  unreadCount: 0,
                  createdAt: '',
                }
              }
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-ash-grey-900">
                {conversation?.title ?? 'Chat'}
              </h2>
              {conversation?.clientId ? (
                <Link
                  to={`/coach/clients/${conversation.clientId}`}
                  className="text-xs text-blue-spruce-600 hover:underline">
                  View patient profile
                </Link>
              ) : null}
            </div>
          </>
        )}
        {isTeam ? (
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="shrink-0 rounded-full p-2 text-ash-grey-500 transition-colors hover:bg-ash-grey-100 hover:text-ash-grey-700"
            aria-label="View group members"
            title="Group info">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </button>
        ) : null}
      </header>

      <TeamMembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        conversation={conversation}
      />

      <div className="min-h-0 flex-1">
        <ChatThread
          conversationId={conversationId}
          messages={messages}
          isLoading={isLoading}
          className="h-full"
          emptyHint={
            conversation?.type === 'team'
              ? 'Share caseload updates, review tips, or coordinate with your team.'
              : 'Ask about portions, ingredients, allergies, or meal context.'
          }
        />
      </div>
    </>
  );
}

function EmptyChatPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#f0f2f5] px-8 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-ash-grey-200 bg-white text-5xl shadow-sm">
        💬
      </div>
      <h2 className="text-2xl font-light text-ash-grey-700">MiraFood Messages</h2>
      <p className="mt-2 max-w-sm text-sm text-ash-grey-500">
        Select a conversation to chat with patients or your coach team.
      </p>
    </div>
  );
}

export function MessagesPage() {
  const { id: selectedId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  useChatRealtime(selectedId ?? null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { data: conversations, isLoading } = useChatConversations();
  const teamMutation = useEnsureTeamChannel();

  const filtered = useMemo(() => {
    let list = conversations ?? [];
    if (filter === 'patients') list = list.filter((c) => c.type === 'patient');
    if (filter === 'team') list = list.filter((c) => c.type === 'team');
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.lastMessagePreview?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...list].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }, [conversations, filter, search]);

  function openConversation(conversationId: string) {
    navigate(`/coach/messages/${conversationId}`);
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <div
        className={cn(
          'flex w-full flex-col border-r border-ash-grey-200 bg-white lg:w-[380px] lg:shrink-0',
          selectedId ? 'hidden lg:flex' : 'flex',
        )}>
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-ash-grey-200 bg-[#f0f2f5] px-4">
          <h1 className="text-lg font-semibold text-ash-grey-900">Messages</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="!px-2"
              title="New chat"
              onClick={() => setNewChatOpen(true)}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-ash-grey-600" aria-hidden>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!px-2"
              title="Team channel"
              disabled={teamMutation.isPending}
              onClick={() => {
                void teamMutation.mutateAsync().then((conv) => openConversation(conv.id));
              }}>
              <span className="text-lg" aria-hidden>
                👥
              </span>
            </Button>
          </div>
        </header>

        <div className="shrink-0 border-b border-ash-grey-100 px-3 py-2">
          <div className="relative">
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
              placeholder="Search or start new chat"
              className="w-full rounded-lg bg-[#f0f2f5] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-ash-grey-400 focus:bg-white focus:ring-1 focus:ring-blue-spruce-300"
            />
          </div>
          <div className="mt-2 flex gap-1">
            {(['all', 'patients', 'team'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors',
                  filter === tab
                    ? 'bg-blue-spruce-600 text-white'
                    : 'bg-ash-grey-100 text-ash-grey-600 hover:bg-ash-grey-200',
                )}>
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-6 text-center text-sm text-ash-grey-500">Loading conversations…</p>
          ) : filtered.length ? (
            filtered.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                active={conv.id === selectedId}
                onSelect={() => openConversation(conv.id)}
              />
            ))
          ) : (
            <p className="p-6 text-center text-sm text-ash-grey-500">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col bg-[#efeae2]',
          !selectedId ? 'hidden lg:flex' : 'flex',
        )}>
        {selectedId ? (
          <>
            <div className="flex h-[60px] shrink-0 items-center border-b border-ash-grey-200 bg-[#f0f2f5] px-2 lg:hidden">
              <button
                type="button"
                onClick={() => navigate('/coach/messages')}
                className="rounded-lg p-2 text-blue-spruce-600 hover:bg-ash-grey-100"
                aria-label="Back to conversations">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <ChatPanel conversationId={selectedId} />
          </>
        ) : (
          <EmptyChatPanel />
        )}
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onOpenConversation={openConversation}
      />
    </div>
  );
}
