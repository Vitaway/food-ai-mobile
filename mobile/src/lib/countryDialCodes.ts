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
  { iso: 'AU', name: 'Australia', dial: '61' },
] as const;

export const DEFAULT_COUNTRY_ISO = 'RW';

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
