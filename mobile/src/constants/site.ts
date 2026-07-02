import { API_BASE_URL, PROD_API_HOST, PROD_WEB_HOST } from '@/constants/api';

export const APP_NAME = 'MiraFood';
export const APP_SCHEME = 'mirafood';

/** MiraFood web dashboard (coach/admin) — production host */
export const MIRAFOOD_WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || `https://${PROD_WEB_HOST}`;

/** Node API origin — same as {@link API_BASE_URL} */
export { API_BASE_URL, PROD_API_HOST, PROD_WEB_HOST };

/** Vitaway organization site */
export const VITAWAY_ORG_URL = 'https://vitaway.org';

/** Set to `true` to exercise poll-style fake API adapters (see `src/services/index.ts`). */
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
