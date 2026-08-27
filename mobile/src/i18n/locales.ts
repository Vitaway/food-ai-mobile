export type AppLocale = 'en' | 'rw' | 'fr';

export const APP_LOCALES: Array<{
  id: AppLocale;
  label: string;
  nativeLabel: string;
  flag: string;
}> = [
  { id: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { id: 'rw', label: 'Kinyarwanda', nativeLabel: 'Ikinyarwanda', flag: '🇷🇼' },
  { id: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
];

export function normalizeLocale(value: string | null | undefined): AppLocale {
  const raw = (value ?? '').toLowerCase();
  if (raw.startsWith('rw') || raw.startsWith('kin')) return 'rw';
  if (raw.startsWith('fr')) return 'fr';
  return 'en';
}

/** BCP-47 tag for `toLocaleDateString` / `toLocaleTimeString`. */
export function dateLocaleTag(locale: AppLocale): string {
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'rw') return 'rw-RW';
  return 'en-US';
}
