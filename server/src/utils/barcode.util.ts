/** Strip to digits only — barcodes are always handled as strings (leading zeros preserved). */
export function normalizeBarcodeDigits(raw: string): string {
  return raw.trim().replace(/\D/g, "");
}

/** Preferred cache key barcode (EAN-13 with leading zero when applicable). */
export function canonicalBarcode(raw: string): string {
  const digits = normalizeBarcodeDigits(raw);
  if (!digits) return "";
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

/** Lookup variants tried against PostgreSQL and Open Food Facts. */
export function barcodeLookupVariants(raw: string): string[] {
  const digits = normalizeBarcodeDigits(raw);
  if (!digits) return [];

  const variants = new Set<string>([digits, canonicalBarcode(digits)]);
  if (digits.length === 13 && digits.startsWith("0")) {
    variants.add(digits.slice(1));
  }
  if (digits.length === 8) {
    variants.add(digits.padStart(13, "0"));
  }
  return [...variants].filter(Boolean);
}

export function isLikelyBarcodeQuery(raw: string): boolean {
  const digits = normalizeBarcodeDigits(raw);
  return digits.length >= 8 && digits.length <= 14;
}
