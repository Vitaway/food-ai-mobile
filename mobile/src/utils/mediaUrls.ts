import { API_BASE_URL } from '@/constants/api';

/** Turn stored avatar/meal URLs into something the mobile app can load. */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${trimmed}`;
  }
  return trimmed;
}
