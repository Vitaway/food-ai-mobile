/** Normalize scanned / typed product codes and return lookup variants (EAN-13, UPC-A, etc.). */
export function barcodeLookupVariants(raw: string): string[] {
  const digits = raw.trim().replace(/\D/g, '');
  if (!digits) return [];

  const variants = new Set<string>([digits]);

  if (digits.length === 12) {
    variants.add(`0${digits}`);
  }
  if (digits.length === 13 && digits.startsWith('0')) {
    variants.add(digits.slice(1));
  }
  if (digits.length === 8) {
    variants.add(digits.padStart(13, '0'));
  }

  return [...variants];
}

export function isLikelyBarcode(value: string): boolean {
  const digits = value.trim().replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

/** Prefer EAN-13 form for display and API lookup (UPC-A → leading zero). */
export function normalizeScannedBarcode(raw: string): string {
  const digits = raw.trim().replace(/\D/g, '');
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

/** Pull digits from expo-camera scan payloads (`data` can be empty on some iOS builds). */
export function extractScannedBarcode(result: {
  data?: string | null;
  raw?: string | null;
}): string | null {
  for (const value of [result.data, result.raw]) {
    if (!value || typeof value !== 'string') continue;
    const digits = value.trim().replace(/\D/g, '');
    if (isLikelyBarcode(digits)) {
      return normalizeScannedBarcode(digits);
    }
  }
  return null;
}

/** EAN-8 / EAN-13 / UPC-A (12-digit) check digit validation — filters garbage camera reads. */
export function isValidProductBarcode(raw: string): boolean {
  const digits = normalizeScannedBarcode(raw);
  if (digits.length === 8) return isValidEan8CheckDigit(digits);
  if (digits.length === 13) return isValidEanCheckDigit(digits);
  return false;
}

function isValidEan8CheckDigit(ean8: string): boolean {
  if (ean8.length !== 8 || !/^\d+$/.test(ean8)) return false;
  let sum = 0;
  for (let i = 0; i < 7; i += 1) {
    sum += Number(ean8[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(ean8[7]);
}

function isValidEanCheckDigit(ean13: string): boolean {
  if (ean13.length !== 13 || !/^\d+$/.test(ean13)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(ean13[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(ean13[12]);
}
