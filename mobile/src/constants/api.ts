/** Production host — Node auth API not deployed here yet (legacy Flask). */
const LEGACY_PROD_HOST = 'vitaway.nsengi.space';
const DEV_API_URL = 'http://127.0.0.1:3011';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

  if (__DEV__) {
    if (!fromEnv || fromEnv.includes(LEGACY_PROD_HOST)) {
      return DEV_API_URL;
    }
    // Another local API (e.g. daily-focus) may already occupy :3010.
    if (fromEnv.endsWith(':3010')) {
      return DEV_API_URL;
    }
  }

  return fromEnv;
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
