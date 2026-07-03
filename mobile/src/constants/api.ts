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
    return manualHost.replace(/^https?:\/\//, '').split(':')[0] || null;
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

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

  if (__DEV__) {
    const port = getDevApiPort(fromEnv || `http://127.0.0.1:${DEFAULT_DEV_PORT}`);

    if (!fromEnv || isProdApiHost(fromEnv)) {
      const host = getMetroDevHost() ?? '127.0.0.1';
      return buildDevApiUrl(host, DEFAULT_DEV_PORT);
    }

    // Another local API (e.g. daily-focus) may already occupy :3010.
    if (fromEnv.endsWith(':3010')) {
      const host = getMetroDevHost() ?? '127.0.0.1';
      return buildDevApiUrl(host, DEFAULT_DEV_PORT);
    }

    const isLocalhost = fromEnv.includes('127.0.0.1') || fromEnv.includes('localhost');

    // Physical devices cannot reach the dev machine via 127.0.0.1 — use Metro's LAN host.
    if (isLocalhost && Constants.isDevice) {
      const host = getMetroDevHost();
      if (host) {
        return buildDevApiUrl(host, port);
      }
    }

    // Android emulator maps host loopback to 10.0.2.2
    if (Platform.OS === 'android' && isLocalhost && !Constants.isDevice) {
      return buildDevApiUrl('10.0.2.2', port);
    }
  }

  if (fromEnv) {
    return fromEnv;
  }

  return `https://${PROD_API_HOST}`;
}

/** MiraFood API origin (no trailing slash) */
export const API_BASE_URL = resolveApiBaseUrl();

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

/** @deprecated Use API_BASE_URL — kept for existing imports */
export const PLATE_API_URL = API_BASE_URL;

/** @deprecated Use isApiConfigured */
export const isPlateApiConfigured = isApiConfigured;
