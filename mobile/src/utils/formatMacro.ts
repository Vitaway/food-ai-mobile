export function formatMacroG(value: number): string {
  if (!Number.isFinite(value)) return '0g';
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${text}g`;
}
