/** Format 0–23 hour as 12-hour clock label (e.g. 22 → "10:00 PM"). */
export function formatHour12(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}:00 ${period}`;
}

export function formatQuietHoursRange(start: number, end: number) {
  if (start === end) return 'Off — nudges run all day';
  return `${formatHour12(start)} – ${formatHour12(end)}`;
}
