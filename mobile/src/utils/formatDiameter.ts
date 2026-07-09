/** Round plate/bowl diameter to two decimal places. */
export function roundDiameterCm(cm: number): number {
  return Math.round(cm * 100) / 100;
}

/** Format plate/bowl diameter for display (two decimals). */
export function formatDiameterCm(cm: number): string {
  return `${roundDiameterCm(cm).toFixed(2)} cm`;
}
