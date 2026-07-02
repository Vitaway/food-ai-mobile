/** Standard drinking glass / cup used across the app (250 ml). */
export const WATER_CUP_ML = 250;

export function cupsToMl(cups: number): number {
  return Math.round(cups * WATER_CUP_ML);
}

export function mlToCups(ml: number): number {
  return ml / WATER_CUP_ML;
}

export function formatCups(cups: number): string {
  if (!Number.isFinite(cups)) return '0';
  const rounded = Math.round(cups * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatCupsLabel(cups: number): string {
  const value = formatCups(cups);
  return cups === 1 ? '1 cup' : `${value} cups`;
}
