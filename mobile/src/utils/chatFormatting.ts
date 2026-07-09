export function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatChatDateDivider(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatInboxWhen(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  if (date >= weekAgo) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function groupMessagesByDate<T extends { createdAt: string }>(messages: T[]) {
  const groups: Array<{ dateKey: string; label: string; messages: T[] }> = [];
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
