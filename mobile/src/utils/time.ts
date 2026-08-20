export function formatDurationFromMinutes(minutesRaw: number | null | undefined) {
  if (minutesRaw == null || !Number.isFinite(minutesRaw)) return 'Unknown';
  const minutes = Math.max(0, Math.round(minutesRaw));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days} day ${remHours} hr` : `${days} day${days === 1 ? '' : 's'}`;
}

export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  const time = date.getTime();
  if (!Number.isFinite(time)) return 'unknown';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
