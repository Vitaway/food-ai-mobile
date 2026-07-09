import type { MealAnalysisPreview } from '@/types';
import { isNegligibleCalorieLabel } from '@/utils/negligibleFoodItems';
import { formatDiameterCm } from '@/utils/formatDiameter';

/** Typical dinner plate diameter used as the mock model baseline. */
export const REFERENCE_PLATE_DIAMETER_CM = 26;

export function portionScaleForPlate(plateDiameterCm: number | null | undefined): number {
  if (plateDiameterCm == null || plateDiameterCm <= 0) return 1;
  const ratio = plateDiameterCm / REFERENCE_PLATE_DIAMETER_CM;
  return Math.min(2, Math.max(0.55, ratio ** 2));
}

export function portionNoteForPlate(plateDiameterCm: number | null | undefined): string | null {
  if (plateDiameterCm == null) return null;

  const scale = portionScaleForPlate(plateDiameterCm);
  if (Math.abs(scale - 1) < 0.08) {
    return `Portions estimated for a ${formatDiameterCm(plateDiameterCm)} plate (near standard size).`;
  }

  const direction = scale > 1 ? 'larger' : 'smaller';
  const pct = Math.round(Math.abs(scale - 1) * 100);
  return `Plate is ${formatDiameterCm(plateDiameterCm)} — portions scaled ${pct}% ${direction} vs a standard dinner plate.`;
}

export function applyPlatePortionScale(
  analysis: MealAnalysisPreview,
  plateDiameterCm: number | null | undefined,
): MealAnalysisPreview {
  if (plateDiameterCm == null) return analysis;

  const scale = portionScaleForPlate(plateDiameterCm);
  if (Math.abs(scale - 1) < 0.02) {
    return {
      ...analysis,
      plateDiameterCm,
      portionScaleFactor: 1,
      portionNote: portionNoteForPlate(plateDiameterCm) ?? undefined,
    };
  }

  const items = analysis.items.map((item) => {
    if (item.estimatedWeightG <= 0 || isNegligibleCalorieLabel(item.label)) {
      return item;
    }

    const weightG = Math.round(item.estimatedWeightG * scale);
    const nutritionFactor = weightG / item.estimatedWeightG;
    return {
      ...item,
      estimatedWeightG: weightG,
      nutrition: {
        ...item.nutrition,
        caloriesKcal: Math.round(item.nutrition.caloriesKcal * nutritionFactor),
        proteinG: Math.round(item.nutrition.proteinG * nutritionFactor * 10) / 10,
        carbsG: Math.round(item.nutrition.carbsG * nutritionFactor * 10) / 10,
        fatG: Math.round(item.nutrition.fatG * nutritionFactor * 10) / 10,
        fiberG: Math.round(item.nutrition.fiberG * nutritionFactor * 10) / 10,
        sugarG: item.nutrition.sugarG
          ? Math.round(item.nutrition.sugarG * nutritionFactor * 10) / 10
          : undefined,
        sodiumMg: item.nutrition.sodiumMg
          ? Math.round(item.nutrition.sodiumMg * nutritionFactor)
          : undefined,
      },
    };
  });

  const totalWeightG = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const totalNutrition = items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + item.nutrition.caloriesKcal,
      proteinG: acc.proteinG + item.nutrition.proteinG,
      carbsG: acc.carbsG + item.nutrition.carbsG,
      fatG: acc.fatG + item.nutrition.fatG,
      fiberG: acc.fiberG + item.nutrition.fiberG,
      sugarG: (acc.sugarG ?? 0) + (item.nutrition.sugarG ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (item.nutrition.sodiumMg ?? 0),
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 },
  );

  const petals = items.map((item) => ({
    label: item.label,
    percent: totalWeightG > 0 ? Math.round((item.estimatedWeightG / totalWeightG) * 100) : 0,
    color: '#50af73',
  }));

  return {
    ...analysis,
    items,
    totalNutrition,
    totalWeightG,
    petals,
    plateDiameterCm,
    portionScaleFactor: scale,
    portionNote: portionNoteForPlate(plateDiameterCm) ?? undefined,
  };
}
