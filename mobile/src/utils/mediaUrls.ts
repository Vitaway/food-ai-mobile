import { API_BASE_URL } from '@/constants/api';

function apiOrigin(): string {
  return API_BASE_URL.replace(/\/$/, '');
}

/** Turn stored avatar/meal/chat URLs into something the mobile app can load. */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `${apiOrigin()}${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${apiOrigin()}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  return trimmed;
}
