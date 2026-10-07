import type { DetectedFoodItem } from '@/types';

export type FoodPinPoint = {
  id: string;
  label: string;
  grams: number;
  kcal: number;
  emoji?: string;
  x: number;
  y: number;
  inferred: boolean;
};

/** Spread pins in a gentle arc when vision did not return positions. */
export function fallbackPinLayout(index: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: 0.5, y: 0.42 };
  const t = total === 1 ? 0 : index / (total - 1);
  const angle = Math.PI * (0.15 + 0.7 * t);
  const radius = 0.28 + (total > 4 ? 0.04 : 0);
  return {
    x: Math.max(0.14, Math.min(0.86, 0.5 + Math.cos(angle) * radius)),
    y: Math.max(0.18, Math.min(0.72, 0.48 + Math.sin(angle) * radius * 0.85)),
  };
}

export function resolveFoodPins(items: DetectedFoodItem[]): FoodPinPoint[] {
  const usable = items.filter((item) => item.estimatedWeightG > 0 || item.nutrition.caloriesKcal > 0);
  return usable.map((item, index) => {
    const hasPin =
      item.pin &&
      typeof item.pin.x === 'number' &&
      typeof item.pin.y === 'number' &&
      item.pin.x >= 0 &&
      item.pin.x <= 1 &&
      item.pin.y >= 0 &&
      item.pin.y <= 1;
    const point = hasPin
      ? { x: item.pin!.x, y: item.pin!.y }
      : fallbackPinLayout(index, usable.length);
    return {
      id: item.id,
      label: item.label,
      grams: Math.round(item.estimatedWeightG),
      kcal: Math.round(item.nutrition.caloriesKcal),
      emoji: item.emoji,
      x: point.x,
      y: point.y,
      inferred: !hasPin,
    };
  });
}

export function itemsHaveRealPins(items: DetectedFoodItem[]): boolean {
  return items.some(
    (item) =>
      item.pin &&
      typeof item.pin.x === 'number' &&
      typeof item.pin.y === 'number' &&
      item.pin.x >= 0 &&
      item.pin.x <= 1 &&
      item.pin.y >= 0 &&
      item.pin.y <= 1,
  );
}
