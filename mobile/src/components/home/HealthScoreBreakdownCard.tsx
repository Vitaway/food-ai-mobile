import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Breakdown = {
  nutrientScore: number;
  nutrientDataCoverage?: number;
  macroScore: number;
  calorieScore: number;
  consistencyScore: number;
  varietyScore: number;
};

type ScoreKey = Exclude<keyof Breakdown, 'nutrientDataCoverage'>;

const ROWS: Array<{ key: ScoreKey; label: string; weight: string }> = [
  { key: 'nutrientScore', label: 'Nutrient adequacy', weight: '30%' },
  { key: 'macroScore', label: 'Macro balance', weight: '25%' },
  { key: 'calorieScore', label: 'Calorie balance', weight: '20%' },
  { key: 'consistencyScore', label: 'Meal consistency', weight: '15%' },
  { key: 'varietyScore', label: 'Dietary variety', weight: '10%' },
];

export function HealthScoreBreakdownCard({
  totalScore,
  breakdown,
}: {
  totalScore: number;
  breakdown: Breakdown;
}) {
  return (
    <View className="rounded-2xl border border-ash-grey-100 bg-white p-4">
      <View className="mb-3 flex-row items-end justify-between">
        <Text className="font-sans-semibold text-base text-neutral-900">Health score breakdown</Text>
        <Text className="font-sans-bold text-2xl text-blue-spruce-700">{totalScore}</Text>
      </View>
      {ROWS.map((row) => (
        <View key={row.key} className="mb-2">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm text-neutral-600">{row.label}</Text>
            <Text className="text-xs text-neutral-400">{row.weight}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
            <View className="h-full rounded-full bg-blue-spruce-500" style={{ width: `${breakdown[row.key]}%` }} />
          </View>
          <Text className="mt-0.5 text-xs text-neutral-500">{breakdown[row.key]}/100</Text>
        </View>
      ))}
      {breakdown.nutrientDataCoverage != null ? (
        <Text className="mt-2 text-xs leading-5 text-neutral-500">
          Nutrient data coverage: {breakdown.nutrientDataCoverage}%. Missing micronutrient data lowers
          confidence instead of being treated as perfect intake.
        </Text>
      ) : null}
    </View>
  );
}
