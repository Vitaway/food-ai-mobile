import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { MealCalorieRow } from '@/hooks/useInsightsData';

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

type InsightsMealBreakdownProps = {
  rows: MealCalorieRow[];
  maxCalories: number;
  totalCalories: number;
};

export function InsightsMealBreakdown({ rows, maxCalories, totalCalories }: InsightsMealBreakdownProps) {
  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Where calories come from</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Breakdown by meal type this period</Text>

      {rows.length === 0 ? (
        <View className="mt-4 rounded-2xl bg-ash-grey-50 px-4 py-6">
          <Text className="text-center text-sm text-neutral-500">Approved meals will appear here as a breakdown.</Text>
        </View>
      ) : (
        <View className="mt-4 gap-4">
          {rows.map((row) => {
            const share = totalCalories > 0 ? Math.round((row.calories / totalCalories) * 100) : 0;
            const width = Math.max((row.calories / maxCalories) * 100, 6);
            return (
              <View key={row.id}>
                <View className="mb-1.5 flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    <Text className="flex-1 font-sans-medium text-sm text-neutral-800" numberOfLines={1}>
                      {row.label}
                    </Text>
                  </View>
                  <Text className="font-sans-semibold text-sm text-neutral-900">
                    {row.calories} kcal · {share}%
                  </Text>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-ash-grey-100">
                  <View className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: row.color }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
