/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(date = new Date()) {
  return toLocalDateKey(date);
}

export function getDateWindow(days: number, anchor = new Date()) {
  const end = toLocalDateKey(anchor);
  const startDate = new Date(anchor);
  startDate.setHours(12, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));
  return { start: toLocalDateKey(startDate), end };
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

type DayHeadingOptions = {
  locale?: string;
  today?: string;
  yesterday?: string;
};

export function formatDayHeading(dateKey: string, opts?: DayHeadingOptions) {
  if (dateKey === todayKey()) return opts?.today ?? 'Today';
  const date = parseDateKey(dateKey);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === todayKey(yesterday)) return opts?.yesterday ?? 'Yesterday';
  return date.toLocaleDateString(opts?.locale ?? 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDisplayDate(date = new Date(), locale = 'en-US') {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string, locale = 'en-US') {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
