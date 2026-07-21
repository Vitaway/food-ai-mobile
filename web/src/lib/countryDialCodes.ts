/** ISO country → dial code. Ordered with primary markets first, then A–Z. */
export type CountryDialCode = {
  iso: string;
  name: string;
  dial: string;
};

export const COUNTRY_DIAL_CODES: readonly CountryDialCode[] = [
  { iso: 'RW', name: 'Rwanda', dial: '250' },
  { iso: 'KE', name: 'Kenya', dial: '254' },
  { iso: 'UG', name: 'Uganda', dial: '256' },
  { iso: 'TZ', name: 'Tanzania', dial: '255' },
  { iso: 'BI', name: 'Burundi', dial: '257' },
  { iso: 'CD', name: 'DR Congo', dial: '243' },
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'ZA', name: 'South Africa', dial: '27' },
  { iso: 'ET', name: 'Ethiopia', dial: '251' },
  { iso: 'SS', name: 'South Sudan', dial: '211' },
  { iso: 'SO', name: 'Somalia', dial: '252' },
  { iso: 'DJ', name: 'Djibouti', dial: '253' },
  { iso: 'ER', name: 'Eritrea', dial: '291' },
  { iso: 'ZM', name: 'Zambia', dial: '260' },
  { iso: 'ZW', name: 'Zimbabwe', dial: '263' },
  { iso: 'MW', name: 'Malawi', dial: '265' },
  { iso: 'MZ', name: 'Mozambique', dial: '258' },
  { iso: 'BW', name: 'Botswana', dial: '267' },
  { iso: 'NA', name: 'Namibia', dial: '264' },
  { iso: 'AO', name: 'Angola', dial: '244' },
  { iso: 'SN', name: 'Senegal', dial: '221' },
  { iso: 'CI', name: "Côte d'Ivoire", dial: '225' },
  { iso: 'CM', name: 'Cameroon', dial: '237' },
  { iso: 'EG', name: 'Egypt', dial: '20' },
  { iso: 'MA', name: 'Morocco', dial: '212' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'BE', name: 'Belgium', dial: '32' },
  { iso: 'NL', name: 'Netherlands', dial: '31' },
  { iso: 'CH', name: 'Switzerland', dial: '41' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'BR', name: 'Brazil', dial: '55' },
] as const;

export const DEFAULT_COUNTRY_ISO = 'RW';

/** Regional indicator symbols from ISO 3166-1 alpha-2. */
export function countryFlagEmoji(iso: string): string {
  const code = iso.trim().toUpperCase();
  if (code.length !== 2) return '🏳️';
  const a = code.codePointAt(0);
  const b = code.codePointAt(1);
  if (a == null || b == null) return '🏳️';
  return String.fromCodePoint(127397 + a, 127397 + b);
}

export function getCountryByIso(iso: string): CountryDialCode | undefined {
  return COUNTRY_DIAL_CODES.find((c) => c.iso === iso);
}

/** Longest dial-code match first so +250 wins over +2, +1 ambiguities prefer US. */
const DIAL_SORTED = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dial.length - a.dial.length);

export type ParsedPhone = {
  iso: string;
  dial: string;
  national: string;
};

export function parsePhoneValue(value: string | undefined | null): ParsedPhone {
  const raw = (value ?? '').trim();
  const digitsOnly = raw.replace(/[^\d+]/g, '');
  const fallback = getCountryByIso(DEFAULT_COUNTRY_ISO)!;

  if (!digitsOnly) {
    return { iso: fallback.iso, dial: fallback.dial, national: '' };
  }

  const withPlus = digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly.replace(/^\+/, '')}`;
  const rest = withPlus.slice(1);

  for (const country of DIAL_SORTED) {
    if (rest.startsWith(country.dial)) {
      return {
        iso: country.iso,
        dial: country.dial,
        national: rest.slice(country.dial.length).replace(/\D/g, ''),
      };
    }
  }

  return {
    iso: fallback.iso,
    dial: fallback.dial,
    national: rest.replace(/\D/g, ''),
  };
}

export function formatPhoneValue(iso: string, national: string): string {
  const country = getCountryByIso(iso) ?? getCountryByIso(DEFAULT_COUNTRY_ISO)!;
  const local = national.replace(/\D/g, '');
  if (!local) return '';
  return `+${country.dial}${local}`;
}
