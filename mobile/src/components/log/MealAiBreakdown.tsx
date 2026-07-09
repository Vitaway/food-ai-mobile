import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';
import { formatMacroG } from '@/utils/formatMacro';

type MealAiBreakdownProps = {
  analysis: MealAnalysisPreview;
};

export function MealAiBreakdown({ analysis }: MealAiBreakdownProps) {
  const confidencePct = Math.round(analysis.confidenceAvg * 100);

  return (
    <LogCard>
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-shamrock-100">
          <Ionicons name="sparkles" size={18} color="#1D9E75" />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-base text-neutral-900">What AI saw</Text>
          <Text className="text-sm text-neutral-500">{confidencePct}% average confidence</Text>
        </View>
      </View>

      {analysis.portionNote ? (
        <View className="mt-3 rounded-2xl bg-blue-spruce-50 px-3 py-2.5">
          <Text className="text-sm leading-5 text-blue-spruce-800">{analysis.portionNote}</Text>
        </View>
      ) : null}

      <View className="mt-4 gap-2.5">
        {analysis.items.map((item) => {
          const itemConfidence = Math.round(item.confidence * 100);
          return (
            <View
              key={item.id}
              className="flex-row items-center gap-3 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-3 py-3">
              <Text className="text-2xl">{item.emoji ?? '🍽️'}</Text>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-semibold text-sm text-neutral-900">{item.label}</Text>
                <Text className="mt-0.5 text-xs text-neutral-500">
                  {item.estimatedWeightG} g · {item.nutrition.caloriesKcal} kcal · P{' '}
                  {formatMacroG(item.nutrition.proteinG)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-sans-semibold text-xs text-shamrock-700">{itemConfidence}%</Text>
                <Text className="text-[10px] text-neutral-400">sure</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View className="mt-4 rounded-2xl bg-neutral-900 px-4 py-3">
        <Text className="font-sans-semibold text-sm text-white">AI totals</Text>
        <Text className="mt-1 text-sm text-white/80">
          {analysis.totalWeightG} g · {analysis.totalNutrition.caloriesKcal} kcal
        </Text>
        <Text className="mt-1 text-xs text-white/65">
          Protein {formatMacroG(analysis.totalNutrition.proteinG)} · Carbs{' '}
          {formatMacroG(analysis.totalNutrition.carbsG)} · Fat {formatMacroG(analysis.totalNutrition.fatG)}
        </Text>
      </View>
    </LogCard>
  );
}
