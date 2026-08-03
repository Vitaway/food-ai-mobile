/**
 * Parse a CSV query string into trimmed non-empty parts.
 * routing-controllers must type array-like query params as `string` (not
 * `string | string[]`), otherwise a value like `recipe` is treated as JSON
 * and rejected with "cannot be parsed into JSON".
 */
export function parseCsvQueryParam(value?: string | null): string[] | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  // Allow accidental JSON array payloads from older clients.
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        const parts = parsed.map((item) => String(item).trim()).filter(Boolean);
        return parts.length ? parts : undefined;
      }
    } catch {
      // fall through to CSV split
    }
  }
  const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}
