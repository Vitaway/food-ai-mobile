type SubscriptionRequiredListener = (message: string) => void;

const listeners = new Set<SubscriptionRequiredListener>();

export function onSubscriptionRequired(listener: SubscriptionRequiredListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSubscriptionRequired(message: string) {
  listeners.forEach((listener) => listener(message));
}

export function isSubscriptionRequiredMessage(message: string | undefined | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('active subscription is required') ||
    lower.startsWith('subscription is ') ||
    lower.startsWith('family subscription is ') ||
    lower.includes('subscription has expired') ||
    lower.includes('family subscription has expired') ||
    lower === 'subscription required' ||
    lower.includes('an active subscription is required')
  );
}
