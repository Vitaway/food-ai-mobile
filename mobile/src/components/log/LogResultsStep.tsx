import { useMemo } from 'react';
import { Image, View } from 'react-native';

import { CompactMealTypePicker } from '@/components/log/CompactMealTypePicker';
import { IngredientList } from '@/components/log/IngredientList';
import { MealAiBreakdown } from '@/components/log/MealAiBreakdown';
import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { MealTypeId } from '@/constants/mealTypes';
import type { MealAnalysisPreview } from '@/types';
import { formatDiameterCm } from '@/utils/formatDiameter';
import { formatMacroG } from '@/utils/formatMacro';
import { applyServingUnitToItem, recalculateAnalysisTotals, SERVING_UNITS } from '@/utils/servingUnits';

type LogResultsStepProps = {
  analysis: MealAnalysisPreview;
  onAnalysisChange: (next: MealAnalysisPreview) => void;
  imageUri?: string;
  selectedMealType: MealTypeId | null;
  onSelectMealType: (id: MealTypeId) => void;
};

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800' },
  orange: { bg: 'bg-cinnamon-wood-100', text: 'text-cinnamon-wood-700' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

export function LogResultsStep({
  analysis,
  onAnalysisChange,
  imageUri,
  selectedMealType,
  onSelectMealType,
}: LogResultsStepProps) {
  const flag = FLAG_STYLES[analysis.healthFlag];

  const ingredients = analysis.items.map((item) => ({
    id: item.id,
    name: item.label,
    weightG: item.estimatedWeightG,
    servingUnit: item.servingUnit ?? 'g',
    servingAmount: item.servingAmount ?? 1,
    emoji: item.emoji ?? '🍽️',
    macros: {
      carbs: formatMacroG(item.nutrition.carbsG),
      fats: formatMacroG(item.nutrition.fatG),
      sugar: formatMacroG(item.nutrition.sugarG ?? 0),
    },
  }));

  const macroSummary = useMemo(
    () => [
      { label: 'Protein', value: formatMacroG(analysis.totalNutrition.proteinG), color: '#1D9E75' },
      { label: 'Carbs', value: formatMacroG(analysis.totalNutrition.carbsG), color: '#023459' },
      { label: 'Fat', value: formatMacroG(analysis.totalNutrition.fatG), color: semanticColors.accentOrange },
    ],
    [analysis.totalNutrition],
  );

  return (
    <>
      <LogCard className="border border-blue-spruce-100 bg-blue-spruce-50/60">
        <Text className="font-sans-semibold text-sm text-blue-spruce-800">Almost done</Text>
        <Text className="mt-1 text-sm leading-5 text-blue-spruce-700">
          Review the AI estimate below, pick a meal type, then tap <Text className="font-sans-semibold">Submit for coach review</Text> at the bottom.
        </Text>
      </LogCard>

      <View className={`rounded-2xl px-4 py-3 ${flag.bg}`}>
        <Text className={`font-sans-semibold text-sm ${flag.text}`}>{analysis.healthMessage}</Text>
      </View>

      <LogCard>
        <View className="flex-row gap-4">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="h-24 w-24 rounded-2xl bg-ash-grey-100" resizeMode="cover" />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-2xl bg-ash-grey-100">
              <Text className="text-3xl">🍽️</Text>
            </View>
          )}
          <View className="min-w-0 flex-1 justify-center">
            <Text className="font-sans-bold text-xl text-neutral-900">{analysis.mealName}</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {analysis.totalWeightG} g · {analysis.totalNutrition.caloriesKcal} kcal
              {analysis.plateDiameterCm ? ` · ${formatDiameterCm(analysis.plateDiameterCm)}` : ''}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          {macroSummary.map((macro) => (
            <View key={macro.label} className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-2.5">
              <Text className="text-xs text-neutral-500">{macro.label}</Text>
              <Text className="mt-0.5 font-sans-bold text-base" style={{ color: macro.color }}>
                {macro.value}
              </Text>
            </View>
          ))}
        </View>
      </LogCard>

      <LogCard>
        <CompactMealTypePicker selected={selectedMealType} onSelect={onSelectMealType} />
        {!selectedMealType ? (
          <Text className="mt-2 text-sm text-cinnamon-wood-600">Pick a meal type before submitting.</Text>
        ) : null}
      </LogCard>

      <MealAiBreakdown analysis={analysis} />

      <LogCard>
        <Text className="mb-3 font-sans-semibold text-base text-neutral-900">Ingredients</Text>
        <IngredientList
          ingredients={ingredients}
          onCycleServingUnit={(ingredientId) => {
            const nextItems = analysis.items.map((item) => {
              if (item.id !== ingredientId) return item;
              const current = item.servingUnit ?? 'g';
              const idx = SERVING_UNITS.indexOf(current as (typeof SERVING_UNITS)[number]);
              const next = SERVING_UNITS[(idx + 1) % SERVING_UNITS.length];
              return applyServingUnitToItem(item, next, item.servingAmount ?? 1);
            });
            const totals = recalculateAnalysisTotals(nextItems);
            onAnalysisChange({ ...analysis, items: nextItems, ...totals });
          }}
          onAdjustServingAmount={(ingredientId, delta) => {
            const nextItems = analysis.items.map((item) => {
              if (item.id !== ingredientId) return item;
              const amount = Math.max(0.5, (item.servingAmount ?? 1) + delta);
              return applyServingUnitToItem(item, item.servingUnit ?? 'g', amount);
            });
            const totals = recalculateAnalysisTotals(nextItems);
            onAnalysisChange({ ...analysis, items: nextItems, ...totals });
          }}
        />
      </LogCard>
    </>
  );
}
