export const APP_NAME = 'MiraFood';
export const APP_SCHEME = 'mirafood';

/** MiraFood web dashboard (coach/admin) — production host */
export const MIRAFOOD_WEB_URL = 'https://mirafood.vitaway.org';

/** Vitaway organization site */
export const VITAWAY_ORG_URL = 'https://vitaway.org';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Set to `true` to exercise poll-style fake API adapters (see `src/services/index.ts`). */
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
