export function formatMacroG(value: number): string {
  if (!Number.isFinite(value)) return '0g';
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}g`;
}
