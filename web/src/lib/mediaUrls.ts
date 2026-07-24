import { getApiBaseUrl } from '@/lib/apiClient';
import { useAuthStore } from '@/features/auth/stores/authStore';

function apiOrigin(): string {
  const proxy = import.meta.env.VITE_API_PROXY_TARGET as string | undefined;
  if (proxy?.trim()) return proxy.replace(/\/$/, '');

  const base = getApiBaseUrl();
  if (base.startsWith('http')) {
    return base.replace(/\/api\/v1\/?$/, '');
  }

  return 'http://127.0.0.1:3011';
}

function withAccessToken(url: string): string {
  const token = useAuthStore.getState().session?.token;
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

/** Turn stored meal/avatar URLs into something the coach web app can load. */
export function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:') || trimmed.startsWith('ph://')) {
    return null;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/uploads/')) {
        const origin = apiOrigin();
        return withAccessToken(`${origin}${parsed.pathname}${parsed.search}`);
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) {
    const origin = apiOrigin();
    return origin ? withAccessToken(`${origin}${trimmed}`) : trimmed;
  }
  return trimmed;
}

export function isDeviceOnlyImage(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('ph://');
}
