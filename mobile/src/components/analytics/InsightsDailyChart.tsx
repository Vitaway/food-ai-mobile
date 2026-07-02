import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { DailyInsightPoint } from '@/hooks/useInsightsData';

type InsightsDailyChartProps = {
  points: DailyInsightPoint[];
  maxCalories: number;
  calorieTarget: number;
};

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

export function InsightsDailyChart({ points, maxCalories, calorieTarget }: InsightsDailyChartProps) {
  const hasAny = points.some((point) => point.calories > 0);
  const chartMax = Math.max(maxCalories, calorieTarget, 1);
  const targetLine = Math.min((calorieTarget / chartMax) * 100, 100);

  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Daily calories</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Bars show approved meals per day</Text>

      {!hasAny ? (
        <View className="mt-5 rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-4 py-8">
          <Text className="text-center font-sans-semibold text-neutral-700">No calorie data yet</Text>
          <Text className="mt-1 text-center text-sm text-neutral-500">
            Log and get meals approved to see your daily rhythm.
          </Text>
        </View>
      ) : (
        <View className="mt-5">
          <View className="relative h-36 flex-row items-end justify-between gap-1">
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 border-t border-dashed border-cinnamon-wood-300"
              style={{ bottom: `${targetLine}%` }}
            />
            {points.map((point) => {
              const heightPct = point.calories > 0 ? Math.max((point.calories / chartMax) * 100, 8) : 4;
              const active = point.calories > 0;
              return (
                <View key={point.date} className="flex-1 items-center">
                  <View
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: active ? 10 : 4,
                      backgroundColor: active ? semanticColors.accentOrange : '#E8EAE4',
                      opacity: active ? 1 : 0.5,
                    }}
                  />
                  <Text className="mt-2 text-[10px] font-sans-medium text-neutral-400">{point.label}</Text>
                </View>
              );
            })}
          </View>
          <Text className="mt-3 text-xs text-neutral-400">Dashed line = daily calorie target ({calorieTarget} kcal)</Text>
        </View>
      )}
    </View>
  );
}
