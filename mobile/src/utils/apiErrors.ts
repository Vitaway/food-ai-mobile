import { ApiError } from '@/lib/apiClient';
import { isSubscriptionRequiredMessage } from '@/lib/subscriptionEvents';

export function isSubscriptionRequiredError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403 && isSubscriptionRequiredMessage(error.message);
}

/** Map server/auth phrases to short, user-facing copy. */
function humanizeAuthMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('expo go')) {
    return message;
  }
  if (lower.includes('invalid or expired apple') || lower.includes('apple identity')) {
    return 'Apple sign-in failed. Please try again.';
  }
  if (lower.includes('apple sign-in')) return message;
  if (lower.includes('google sign-in')) return message;
  if (lower.includes('incorrect email or password') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('already exists')) return 'An account with this email already exists.';
  if (lower.includes('endpoint not found') || lower.includes('cannot get') || lower.includes('route not found')) {
    return 'This sign-in option is not available yet. Please use email and password.';
  }
  if (lower.includes('docker') || lower.includes('mirafoodserver') || lower.includes('api endpoint')) {
    return 'Something went wrong. Please try again in a moment.';
  }
  return message;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'This sign-in option is not available yet. Please use email and password.';
    }
    if (error.status === 401) {
      const raw = error.message === 'Request failed (401)' ? 'Incorrect email or password.' : error.message;
      return humanizeAuthMessage(raw);
    }
    if (isSubscriptionRequiredError(error)) {
      return 'An active subscription is required to continue.';
    }
    if (error.status === 0) {
      return 'Unable to connect. Check your internet connection and try again.';
    }
    if (error.status >= 500) {
      return 'Server error — please try again in a moment.';
    }
    return humanizeAuthMessage(error.message || fallback);
  }

  if (error instanceof Error && error.message) {
    return humanizeAuthMessage(error.message);
  }

  return fallback;
}
