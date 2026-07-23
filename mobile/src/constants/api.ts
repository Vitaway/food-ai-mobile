import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/** Production API host (Node server on Contabo) */
export const PROD_API_HOST = 'vitaway.nsengi.space';
/** Production web dashboard host */
export const PROD_WEB_HOST = 'mirafood.vitaway.org';
const DEFAULT_DEV_PORT = 3011;

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

function hostFromHostPort(value: string): string | null {
  const host = value.split(':')[0]?.trim();
  return host || null;
}

function getMetroDevHost(): string | null {
  const manualHost = process.env.EXPO_PUBLIC_DEV_API_HOST?.trim();
  if (manualHost) {
    const host = manualHost.replace(/^https?:\/\//, '').split(':')[0] || null;
    // iOS Simulator shares the Mac network stack — loopback works; stale LAN IPs do not.
    if (host && !Constants.isDevice && Platform.OS === 'ios') {
      return null;
    }
    if (host) return host;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostFromHostPort(hostUri);
    if (host && host !== 'localhost') return host;
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2
      ?.extra?.expoGo?.debuggerHost;

  if (typeof debuggerHost === 'string') {
    const host = hostFromHostPort(debuggerHost);
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }

  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const host = hostFromUrl(scriptURL);
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }

  const linkingUri = Constants.linkingUri;
  if (linkingUri) {
    const host = hostFromUrl(linkingUri);
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }

  return null;
}

function getDevApiPort(fromEnv: string): number {
  const match = fromEnv.match(/:(\d+)$/);
  return match ? Number(match[1]) : DEFAULT_DEV_PORT;
}

function buildDevApiUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}

function isProdApiHost(url: string): boolean {
  return url.includes(PROD_API_HOST) || url.includes(PROD_WEB_HOST);
}

function normalizeApiOrigin(url: string): string {
  return url.replace(/\/$/, '').replace(/\/api\/v1$/i, '');
}

function resolveApiBaseUrl(): string {
  const fromEnv = normalizeApiOrigin(process.env.EXPO_PUBLIC_API_URL ?? '');

  if (__DEV__) {
    const port = getDevApiPort(fromEnv || `http://127.0.0.1:${DEFAULT_DEV_PORT}`);
    const metroHost = getMetroDevHost();
    const isLoopbackHost =
      !metroHost || metroHost === 'localhost' || metroHost === '127.0.0.1';

    if (!fromEnv || isProdApiHost(fromEnv)) {
      const host = !isLoopbackHost ? metroHost! : '127.0.0.1';
      return buildDevApiUrl(host, DEFAULT_DEV_PORT);
    }

    // Another local API (e.g. daily-focus) may already occupy :3010.
    if (fromEnv.endsWith(':3010')) {
      const host = !isLoopbackHost ? metroHost! : '127.0.0.1';
      return buildDevApiUrl(host, DEFAULT_DEV_PORT);
    }

    const isLocalhost = fromEnv.includes('127.0.0.1') || fromEnv.includes('localhost');

    // Physical phones / Expo Go cannot reach the Mac via 127.0.0.1 — use Metro LAN host.
    // Prefer any non-loopback Metro host in __DEV__ (not only Constants.isDevice; Expo Go can be flaky there).
    if (isLocalhost && !isLoopbackHost) {
      return buildDevApiUrl(metroHost!, port);
    }

    // Android emulator maps host loopback to 10.0.2.2
    if (Platform.OS === 'android' && isLocalhost && !Constants.isDevice) {
      return buildDevApiUrl('10.0.2.2', port);
    }
  }

  if (fromEnv) {
    return normalizeApiOrigin(fromEnv);
  }

  return `https://${PROD_API_HOST}`;
}

/** MiraFood API origin (no trailing slash, no /api/v1 suffix) */
export const API_BASE_URL = resolveApiBaseUrl();

export function getApiV1Url(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api/v1${suffix}`;
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/** @deprecated Use API_BASE_URL — kept for existing imports */
export const PLATE_API_URL = API_BASE_URL;

/** @deprecated Use isApiConfigured */
export const isPlateApiConfigured = isApiConfigured;
