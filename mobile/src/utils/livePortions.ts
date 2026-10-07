import type { DetectedFoodItem, MealAnalysisPreview } from '@/types';
import {
  estimateRangeFromMid,
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
  type MealLogSource,
} from '@/types/balancedPlate';
import { recalculateAnalysisTotals, scaleItemToGrams } from '@/utils/servingUnits';

export function applyPortionGramsToAnalysis(
  analysis: MealAnalysisPreview,
  itemId: string,
  grams: number,
  mealType?: string | null,
): MealAnalysisPreview {
  const items = analysis.items.map((item) =>
    item.id === itemId ? scaleItemToGrams(item, grams) : item,
  );
  const totals = recalculateAnalysisTotals(items);
  const grouped = withInferredPlateGroups(items);
  const source = (analysis.logSource ?? 'photo') as MealLogSource;
  const balancedPlate =
    resolveBalancedPlateForMeal({ mealType, items: grouped }) ?? analysis.balancedPlate ?? null;
  const estimateRange =
    source === 'barcode'
      ? estimateRangeFromMid(totals.totalNutrition.caloriesKcal, 'barcode')
      : estimateRangeFromMid(totals.totalNutrition.caloriesKcal, source);

  return {
    ...analysis,
    items,
    totalNutrition: totals.totalNutrition,
    totalWeightG: totals.totalWeightG,
    balancedPlate,
    estimateRange,
  };
}

export function portionPreviewPayload(
  analysis: MealAnalysisPreview,
  mealType?: string | null,
) {
  return {
    items: analysis.items.map((item) => ({
      id: item.id,
      label: item.label,
      estimatedWeightG: item.estimatedWeightG,
      plateGroup: item.plateGroup ?? null,
      nutrition: item.nutrition,
      nutritionFoodId: item.nutritionFoodId,
    })),
    logSource: analysis.logSource ?? 'photo',
    mealType: mealType ?? undefined,
  };
}

export function mergePortionPreview(
  analysis: MealAnalysisPreview,
  preview: {
    items?: DetectedFoodItem[] | null;
    totalNutrition?: MealAnalysisPreview['totalNutrition'] | null;
    totalWeightG?: number | null;
    balancedPlate?: MealAnalysisPreview['balancedPlate'];
    estimateRange?: MealAnalysisPreview['estimateRange'];
  },
): MealAnalysisPreview {
  if (!preview.items?.length || !preview.totalNutrition) return analysis;

  const byId = new Map(preview.items.map((item) => [item.id, item]));
  const items = analysis.items.map((item) => {
    const next = byId.get(item.id);
    if (!next) return item;
    return {
      ...item,
      estimatedWeightG: next.estimatedWeightG,
      plateGroup: next.plateGroup ?? item.plateGroup,
      nutrition: next.nutrition,
    };
  });

  return {
    ...analysis,
    items,
    totalNutrition: preview.totalNutrition,
    totalWeightG: preview.totalWeightG ?? analysis.totalWeightG,
    balancedPlate: preview.balancedPlate ?? analysis.balancedPlate,
    estimateRange: preview.estimateRange ?? analysis.estimateRange,
  };
}
