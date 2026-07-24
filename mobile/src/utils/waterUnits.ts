/** Standard drinking glass used across the app (250 ml). */
export const WATER_GLASS_ML = 250;
/** @deprecated Use WATER_GLASS_ML */
export const WATER_CUP_ML = WATER_GLASS_ML;

export function glassesToMl(glasses: number): number {
  return Math.round(glasses * WATER_GLASS_ML);
}

/** @deprecated Use glassesToMl */
export function cupsToMl(cups: number): number {
  return glassesToMl(cups);
}

export function mlToGlasses(ml: number): number {
  return ml / WATER_GLASS_ML;
}

/** @deprecated Use mlToGlasses */
export function mlToCups(ml: number): number {
  return mlToGlasses(ml);
}

export function formatGlasses(glasses: number): string {
  if (!Number.isFinite(glasses)) return '0';
  const rounded = Math.round(glasses * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** @deprecated Use formatGlasses */
export function formatCups(cups: number): string {
  return formatGlasses(cups);
}

export function glassNoun(glasses: number): string {
  return glasses === 1 ? 'glass' : 'glasses';
}

export function formatGlassesLabel(glasses: number): string {
  const value = formatGlasses(glasses);
  return glasses === 1 ? '1 glass of water' : `${value} glasses of water`;
}

/** Short label for compact UI (e.g. "2 glasses"). */
export function formatGlassesShort(glasses: number): string {
  const value = formatGlasses(glasses);
  return glasses === 1 ? '1 glass' : `${value} glasses`;
}

/** @deprecated Use formatGlassesLabel */
export function formatCupsLabel(cups: number): string {
  return formatGlassesLabel(cups);
}
