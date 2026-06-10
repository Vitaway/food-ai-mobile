/** Base URL for the Python plate detection server (no trailing slash). */
export const PLATE_API_URL = process.env.EXPO_PUBLIC_PLATE_API_URL?.replace(/\/$/, '') ?? '';

export function isPlateApiConfigured(): boolean {
  return PLATE_API_URL.length > 0;
}
