/** Neutral fallback when the API has not yet returned a coach title. */
export const COACH_FALLBACK_TITLE = 'Your coach';

/** Use the API title as-is; only fill a missing/blank value. */
export function resolveCoachDisplayName(title?: string | null): string {
  const cleaned = title?.trim();
  return cleaned || COACH_FALLBACK_TITLE;
}
