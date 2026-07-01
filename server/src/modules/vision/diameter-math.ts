import { env } from "../../config/env";

const REFERENCE_TYPICAL_CM: Record<string, number> = {
  sidePlate: 19.0,
  dinnerPlate: 26.0,
  largePlate: 29.0,
  soupBowl: 16.0,
  cerealBowl: 18.0,
  servingBowl: 24.0,
};

const BASE_REFERENCE_CM = 26.0;
const BASE_DISTANCE_CM = 35.0;
const BASE_FRACTION_OF_WIDTH = 0.62;
const CONST_FRAMING = BASE_FRACTION_OF_WIDTH * BASE_DISTANCE_CM;
const K_FRAMING_TO_CM = BASE_REFERENCE_CM / CONST_FRAMING;
const GEOMETRY_DISTANCE_WEIGHT = env.PLATE_GEOMETRY_DISTANCE_WEIGHT;

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export function estimateCameraDistanceCm(
  focal35mm: number | null,
  modelDistance: number | null,
): number {
  if (modelDistance != null && modelDistance >= 20 && modelDistance <= 60) {
    return modelDistance;
  }
  if (focal35mm == null) return BASE_DISTANCE_CM;
  if (focal35mm <= 18) return 30.0;
  if (focal35mm <= 30) return 35.0;
  return 42.0;
}

export function distanceFromFraming(fraction: number): number {
  const safeFraction = Math.max(fraction, 0.12);
  return clamp(CONST_FRAMING / safeFraction, 18.0, 55.0);
}

export function resolveEffectiveDistanceCm(
  fraction: number,
  focal35mm: number | null,
  modelDistance: number | null,
): number {
  const dModel = estimateCameraDistanceCm(focal35mm, modelDistance);
  const dFraming = distanceFromFraming(fraction);
  const weight = clamp(GEOMETRY_DISTANCE_WEIGHT, 0.0, 1.0);
  return dModel * (1.0 - weight) + dFraming * weight;
}

function angleCorrectionFactor(shotAngle: string | null): number {
  if (shotAngle === "top_down") return 1.0;
  if (shotAngle === "moderate") return 1.03;
  if (shotAngle === "steep") return 1.07;
  return 1.02;
}

export function diameterFromFraction(
  fraction: number,
  distanceCm: number,
  shotAngle: string | null,
): number {
  const safeFraction = clamp(fraction, 0.12, 0.96);
  const safeDistance = clamp(distanceCm, 18.0, 55.0);
  return K_FRAMING_TO_CM * safeFraction * safeDistance * angleCorrectionFactor(shotAngle);
}

function scaleForReferenceClass(
  computedCm: number,
  matchedReference: string | null,
  containerType: string | null,
): number {
  let refKey = matchedReference;
  if (!refKey || !(refKey in REFERENCE_TYPICAL_CM)) {
    if (containerType === "bowl") refKey = "cerealBowl";
    else if (containerType === "plate") refKey = "dinnerPlate";
    else return computedCm;
  }
  const typical = REFERENCE_TYPICAL_CM[refKey];
  return computedCm * 0.88 + typical * 0.12;
}

export function resolveDiameterCm(
  raw: Record<string, unknown>,
  analysisContext: Record<string, unknown>,
): number | null {
  const fraction = num(raw.plateDiameterFractionOfImageWidth);
  if (fraction == null) {
    const modelD = num(raw.diameterCm);
    return modelD != null && modelD > 0 ? modelD : null;
  }

  const cameraExif =
    analysisContext.cameraExif && typeof analysisContext.cameraExif === "object"
      ? (analysisContext.cameraExif as Record<string, unknown>)
      : {};
  const focal35 = num(cameraExif.focalLength35mmEquivalent);
  const modelDistance = num(raw.estimatedCameraDistanceCm);
  const distanceCm = resolveEffectiveDistanceCm(fraction, focal35, modelDistance);
  const shotAngle = typeof raw.shotAngle === "string" ? raw.shotAngle : null;
  const computed = diameterFromFraction(fraction, distanceCm, shotAngle);
  const refKey = typeof raw.matchedReference === "string" ? raw.matchedReference : null;
  const container = typeof raw.containerType === "string" ? raw.containerType : null;
  return scaleForReferenceClass(computed, refKey, container);
}
