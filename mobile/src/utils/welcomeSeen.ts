import { getStorageItem, setStorageItem } from '@/utils/storage';

const WELCOME_SEEN_KEY = '@mirafood/welcome_seen';

let memorySeen: boolean | null = null;
const listeners = new Set<(seen: boolean) => void>();

function notify(seen: boolean) {
  for (const listener of listeners) listener(seen);
}

export function subscribeWelcomeSeen(listener: (seen: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function hasSeenWelcome(): Promise<boolean> {
  if (memorySeen != null) return memorySeen;
  const stored = await getStorageItem<boolean>(WELCOME_SEEN_KEY, false);
  memorySeen = stored;
  return stored;
}

export async function markWelcomeSeen(): Promise<void> {
  memorySeen = true;
  notify(true);
  await setStorageItem(WELCOME_SEEN_KEY, true);
}
