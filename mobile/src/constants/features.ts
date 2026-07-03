/** Dev-only poll-style fake API adapters (never enabled in production builds). */
export const USE_MOCK_API = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

/** Local mock analysis / simulated meal pipeline — development without a server only. */
export const USE_OFFLINE_DEV_FALLBACKS = __DEV__ && !USE_MOCK_API;
