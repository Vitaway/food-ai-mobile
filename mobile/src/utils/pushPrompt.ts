import { getStorageItem, setStorageItem } from '@/utils/storage';

const PUSH_PROMPT_KEY = 'mirafood.pushPrompt.v1';

let memorySeen: boolean | null = null;
const listeners = new Set<(seen: boolean) => void>();

function notify(seen: boolean) {
  for (const listener of listeners) {
    listener(seen);
  }
}

export function subscribePushPromptSeen(listener: (seen: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function hasSeenPushPrompt(): Promise<boolean> {
  if (memorySeen != null) return memorySeen;
  const stored = await getStorageItem(PUSH_PROMPT_KEY, false);
  memorySeen = stored;
  return stored;
}

export async function markPushPromptSeen(): Promise<void> {
  memorySeen = true;
  notify(true);
  await setStorageItem(PUSH_PROMPT_KEY, true);
}

/** Test / recovery helper — clears the one-time gate. */
export async function clearPushPromptSeen(): Promise<void> {
  memorySeen = false;
  notify(false);
  await setStorageItem(PUSH_PROMPT_KEY, false);
}
