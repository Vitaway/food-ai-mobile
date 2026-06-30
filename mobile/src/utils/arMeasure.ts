export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type MeasureStep = 'scanning' | 'tapFirst' | 'tapSecond' | 'confirmed';

/** Minimum span between tap points (5 cm). */
export const MIN_POINT_DISTANCE_M = 0.05;

export function viroPositionToPoint3D(position: [number, number, number]): Point3D {
  return { x: position[0], y: position[1], z: position[2] };
}

export function distanceMeters(a: Point3D, b: Point3D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}

export function calculateDiameterCm(a: Point3D, b: Point3D): number {
  const meters = distanceMeters(a, b);
  return Number((meters * 100).toFixed(1));
}

export function pointsAreTooClose(a: Point3D, b: Point3D): boolean {
  return distanceMeters(a, b) < MIN_POINT_DISTANCE_M;
}

export const MIN_PLATE_DIAMETER_CM = 10;
export const MAX_PLATE_DIAMETER_CM = 50;

export function isValidPlateDiameterCm(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_PLATE_DIAMETER_CM && value <= MAX_PLATE_DIAMETER_CM;
}
