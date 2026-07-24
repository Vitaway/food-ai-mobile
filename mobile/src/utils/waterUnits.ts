/** Standard drinking glass used across the app (250 ml). */
export const WATER_GLASS_ML = 250;
/** @deprecated Use WATER_GLASS_ML */
export const WATER_CUP_ML = WATER_GLASS_ML;

export function glassesToMl(glasses: number): number {
  return Math.round(toWholeGlasses(glasses) * WATER_GLASS_ML);
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

/** Clamp/round to whole glasses for logging UI (1, 2, 3…). */
export function toWholeGlasses(glasses: number): number {
  if (!Number.isFinite(glasses)) return 0;
  return Math.max(0, Math.round(glasses));
}

/** Whole-glass amount display. */
export function formatGlasses(glasses: number): string {
  return String(toWholeGlasses(glasses));
}

/** @deprecated Alias — same as formatGlasses (whole glasses only). */
export function formatGlassesWhole(glasses: number): string {
  return formatGlasses(glasses);
}

/** @deprecated Use formatGlasses */
export function formatCups(cups: number): string {
  return formatGlasses(cups);
}

export function glassNoun(glasses: number): string {
  return toWholeGlasses(glasses) === 1 ? 'glass' : 'glasses';
}

export function formatGlassesLabel(glasses: number): string {
  const value = formatGlasses(glasses);
  return `${value} ${glassNoun(glasses)} of water`;
}

/** Short label for compact UI (e.g. "2 glasses", "1 glass"). */
export function formatGlassesShort(glasses: number): string {
  const value = formatGlasses(glasses);
  return `${value} ${glassNoun(glasses)}`;
}

/** @deprecated Use formatGlassesLabel */
export function formatCupsLabel(cups: number): string {
  return formatGlassesLabel(cups);
}
