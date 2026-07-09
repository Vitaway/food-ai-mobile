import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChatMessage } from '@/api/chatApi';
import { useMarkChatRead, useSendChatMessage } from '@/hooks/useChatQueries';
import { resolveMediaUrl } from '@/lib/mediaUrls';
import { cn, formatChatDateDivider, formatChatTime } from '@/lib/utils';

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: Array<{ dateKey: string; label: string; messages: ChatMessage[] }> = [];
  for (const message of messages) {
    const dateKey = message.createdAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last?.dateKey === dateKey) {
      last.messages.push(message);
    } else {
      groups.push({
        dateKey,
        label: formatChatDateDivider(message.createdAt),
        messages: [message],
      });
    }
  }
  return groups;
}

function MessageAttachment({ message }: { message: ChatMessage }) {
  const url = resolveMediaUrl(message.attachmentUrl);
  if (!url) return null;

  if (message.attachmentKind === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        <img
          src={url}
          alt={message.attachmentName ?? 'Image attachment'}
          className="max-h-64 max-w-full rounded-md object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 inline-flex items-center gap-2 rounded-md bg-black/5 px-2.5 py-1.5 text-xs font-semibold text-blue-spruce-700 hover:bg-black/10">
      <span aria-hidden>📎</span>
      <span className="truncate">{message.attachmentName ?? 'Download file'}</span>
    </a>
  );
}

export function ChatThread({
  conversationId,
  messages,
  isLoading,
  mealId,
  emptyHint,
  className,
}: {
  conversationId: string;
  messages?: ChatMessage[];
  isLoading: boolean;
  mealId?: string;
  emptyHint?: string;
  className?: string;
}) {
  const sendMutation = useSendChatMessage(conversationId);
  const markReadMutation = useMarkChatRead();
  const [body, setBody] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => groupMessagesByDate(messages ?? []), [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages?.length]);

  useEffect(() => {
    if (!conversationId) return;
    void markReadMutation.mutateAsync(conversationId).catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreview(null);
      return;
    }
    if (!pendingFile.type.startsWith('image/')) {
      setPendingPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingFile);
    setPendingPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingFile]);

  function clearPendingFile() {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    setPendingFile(file);
  }

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed && !pendingFile) return;

    await sendMutation.mutateAsync({
      body: trimmed || undefined,
      mealId,
      file: pendingFile ?? undefined,
    });
    setBody('');
    clearPendingFile();
    inputRef.current?.focus();
  }

  const canSend = Boolean(body.trim() || pendingFile) && !sendMutation.isPending;

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-[#efeae2]', className)}>
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23d4cfc8%22 fill-opacity=%220.35%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] px-4 py-4 sm:px-6">
        {isLoading ? (
          <p className="text-center text-sm text-ash-grey-500">Loading messages…</p>
        ) : groups.length ? (
          groups.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex justify-center py-2">
                <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-ash-grey-600 shadow-sm">
                  {group.label}
                </span>
              </div>
              {group.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'relative max-w-[min(85%,28rem)] rounded-lg px-3 py-2 shadow-sm',
                      m.isMine
                        ? 'rounded-tr-none bg-[#d9fdd3]'
                        : 'rounded-tl-none bg-white',
                    )}>
                    {!m.isMine ? (
                      <p className="mb-0.5 text-xs font-semibold text-blue-spruce-700">{m.senderName}</p>
                    ) : null}
                    {m.attachmentUrl ? <MessageAttachment message={m} /> : null}
                    {m.body ? (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ash-grey-900">
                        {m.body}
                      </p>
                    ) : null}
                    {m.mealId ? (
                      <Link
                        to={`/coach/queue/${m.mealId}`}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-1 text-xs font-semibold text-blue-spruce-700 hover:bg-black/10">
                        View meal →
                      </Link>
                    ) : null}
                    <p
                      className={cn(
                        'mt-1 text-right text-[11px]',
                        m.isMine ? 'text-ash-grey-500' : 'text-ash-grey-400',
                      )}>
                      {formatChatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-3xl shadow-sm">
              💬
            </div>
            <p className="max-w-xs text-sm text-ash-grey-600">
              {emptyHint ?? 'No messages yet. Say hello below.'}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-ash-grey-200 bg-[#f0f2f5] px-4 py-3">
        {mealId ? (
          <p className="mb-2 text-center text-xs text-ash-grey-500">
            Next message will link to this meal for context
          </p>
        ) : null}

        {pendingFile ? (
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
            {pendingPreview ? (
              <img
                src={pendingPreview}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ash-grey-100 text-xl">
                📎
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ash-grey-900">{pendingFile.name}</p>
              <p className="text-xs text-ash-grey-500">
                {(pendingFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={clearPendingFile}
              className="rounded-full p-2 text-ash-grey-500 hover:bg-ash-grey-100"
              aria-label="Remove attachment">
              ✕
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,text/plain"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ash-grey-600 transition-colors hover:bg-white"
            aria-label="Attach file">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-ash-grey-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
            placeholder="Type a message"
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-spruce-600 text-white transition-colors hover:bg-blue-spruce-700 disabled:opacity-40"
            aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
