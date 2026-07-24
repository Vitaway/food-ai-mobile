import { API_BASE_URL } from '@/constants/api';
import { getApiAuthToken } from '@/lib/apiClient';

function apiOrigin(): string {
  return API_BASE_URL.replace(/\/$/, '');
}

function withAccessToken(url: string): string {
  const token = getApiAuthToken();
  if (!token) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/uploads/')) return url;
    parsed.searchParams.set('access_token', token);
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}access_token=${encodeURIComponent(token)}`;
  }
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
    return withAccessToken(`${apiOrigin()}${trimmed}`);
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        return withAccessToken(`${apiOrigin()}${parsed.pathname}${parsed.search}`);
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  return trimmed;
}
