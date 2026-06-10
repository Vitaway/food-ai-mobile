let pendingPlateDiameterCm: number | null = null;

export function setPlateMeasureIntent(diameterCm: number) {
  pendingPlateDiameterCm = diameterCm;
}

export function consumePlateMeasureIntent(): number | null {
  const value = pendingPlateDiameterCm;
  pendingPlateDiameterCm = null;
  return value;
}

export function peekPlateMeasureIntent(): number | null {
  return pendingPlateDiameterCm;
}
