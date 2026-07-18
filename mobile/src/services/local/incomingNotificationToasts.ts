import type { ToastType } from '@/components/ui/ToastCard';
import type { ServerNotification } from '@/services/remote/consumerApi';

/** Shared across WS + push so the same notification only toasts once. */
const claimedIds = new Set<string>();
const MAX_CLAIMED = 400;

function trimClaims() {
  if (claimedIds.size <= MAX_CLAIMED) return;
  const excess = claimedIds.size - MAX_CLAIMED;
  let removed = 0;
  for (const id of claimedIds) {
    claimedIds.delete(id);
    removed += 1;
    if (removed >= excess) break;
  }
}

/** Seed existing notifications so we don't toast history on cold start. */
export function seedIncomingToastClaims(ids: Iterable<string>) {
  for (const id of ids) claimedIds.add(id);
  trimClaims();
}

/** Returns true the first time this id is claimed (caller should show a toast). */
export function claimIncomingToast(id: string): boolean {
  if (!id || claimedIds.has(id)) return false;
  claimedIds.add(id);
  trimClaims();
  return true;
}

export function clearIncomingToastClaims() {
  claimedIds.clear();
}

export function toastTypeForNotification(notification: ServerNotification): ToastType {
  const haystack = `${notification.title} ${notification.message}`;
  if (notification.kind === 'meal') {
    if (/approv/i.test(haystack) || notification.status === 'approved') return 'success';
    if (/reject|feedback|attention/i.test(haystack) || notification.status === 'rejected') {
      return 'error';
    }
  }
  return 'info';
}
