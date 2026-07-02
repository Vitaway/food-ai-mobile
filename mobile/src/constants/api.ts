import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Production API host (Node server on Contabo) */
export const PROD_API_HOST = 'vitaway.nsengi.space';
/** Production web dashboard host */
export const PROD_WEB_HOST = 'mirafood.vitaway.org';
const DEFAULT_DEV_PORT = 3011;

function getMetroDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return host;
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (typeof debuggerHost === 'string') {
    return debuggerHost.split(':')[0];
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
      if (host && host !== '127.0.0.1' && host !== 'localhost') {
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
