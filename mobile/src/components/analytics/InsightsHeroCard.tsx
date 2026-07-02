import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';

type InsightsHeroCardProps = {
  period: 7 | 30;
  hasData: boolean;
  avgCalories: number;
  calorieTarget: number;
  activeDays: number;
  loggingRate: number;
};

export function InsightsHeroCard({
  period,
  hasData,
  avgCalories,
  calorieTarget,
  activeDays,
  loggingRate,
}: InsightsHeroCardProps) {
  const progress = calorieTarget > 0 && hasData ? Math.min(avgCalories / calorieTarget, 1.2) : 0;
  const progressPct = Math.round(Math.min(progress, 1) * 100);

  return (
    <View
      className="overflow-hidden rounded-[28px] p-5"
      style={{
        backgroundColor: palette['blue-spruce'][600],
        shadowColor: palette['blue-spruce'][900],
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 6,
      }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-sans-medium text-white/75">Last {period} days</Text>
          <Text className="mt-1 font-sans-bold text-3xl text-white">
            {hasData ? avgCalories : '—'}
          </Text>
          <Text className="mt-0.5 text-sm text-white/85">
            {hasData ? `avg kcal / day · target ${calorieTarget}` : 'Log meals to unlock your trends'}
          </Text>
        </View>
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Ionicons name="analytics-outline" size={28} color="#ffffff" />
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-white/12 px-3 py-3">
          <Text className="text-xs text-white/70">Days logged</Text>
          <Text className="mt-0.5 font-sans-bold text-lg text-white">
            {hasData ? `${activeDays}/${period}` : `0/${period}`}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-white/12 px-3 py-3">
          <Text className="text-xs text-white/70">Consistency</Text>
          <Text className="mt-0.5 font-sans-bold text-lg text-white">{hasData ? `${loggingRate}%` : '—'}</Text>
        </View>
        <View className="flex-1 rounded-2xl bg-white/12 px-3 py-3">
          <Text className="text-xs text-white/70">vs target</Text>
          <Text className="mt-0.5 font-sans-bold text-lg text-white">{hasData ? `${progressPct}%` : '—'}</Text>
        </View>
      </View>
    </View>
  );
}
