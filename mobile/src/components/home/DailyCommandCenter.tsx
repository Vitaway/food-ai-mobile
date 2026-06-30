import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { CalorieRing, CalorieRingCaption } from '@/components/home/CalorieRing';
import { MacroProgressBars } from '@/components/home/MacroProgressBars';
import { StreakBadge } from '@/components/home/StreakBadge';
import { HealthScoreBadge } from '@/components/home/DashboardCards';
import { Text } from '@/components/ui/Text';
import type { DailyDashboard } from '@/types';

type MacroBar = {
  label: string;
  consumed: number;
  target: number;
  colorClass: string;
};

type DailyCommandCenterProps = {
  dashboard: DailyDashboard;
  macros: MacroBar[];
  dateLabel: string;
  onAddWater?: () => void;
  onLogMeal?: () => void;
};

export function DailyCommandCenter({
  dashboard,
  macros,
  dateLabel,
  onAddWater,
  onLogMeal,
}: DailyCommandCenterProps) {
  return (
    <View className="rounded-3xl bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-sans-semibold text-lg text-neutral-900">{dateLabel}</Text>
          <Text className="mt-0.5 text-sm text-neutral-500">Daily progress</Text>
        </View>
        <StreakBadge days={dashboard.streakDays} />
      </View>

      <View className="flex-row items-center gap-4">
        <View className="items-center">
          <CalorieRing consumed={dashboard.caloriesConsumed} target={dashboard.calorieTarget} compact />
          <View className="mt-2 w-28">
            <CalorieRingCaption consumed={dashboard.caloriesConsumed} target={dashboard.calorieTarget} />
          </View>
        </View>

        <View className="min-w-0 flex-1 gap-2.5">
          <View className="flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-3 py-2.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="water-outline" size={18} color="#023459" />
              <Text className="font-sans-medium text-sm text-neutral-700">Water</Text>
            </View>
            <Text className="font-sans-semibold text-sm text-neutral-900">
              {dashboard.waterMl}/{dashboard.waterTargetMl} ml
            </Text>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-3 py-2.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="leaf-outline" size={18} color="#1D9E75" />
              <Text className="font-sans-medium text-sm text-neutral-700">Health</Text>
            </View>
            <HealthScoreBadge score={dashboard.healthScore} />
          </View>

          <View className="flex-row gap-2">
            {onAddWater ? (
              <Pressable
                onPress={onAddWater}
                className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-blue-spruce-50 py-2">
                <Ionicons name="add" size={14} color="#023459" />
                <Text className="font-sans-semibold text-xs text-blue-spruce-700">+250ml</Text>
              </Pressable>
            ) : null}
            {onLogMeal ? (
              <Pressable
                onPress={onLogMeal}
                className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-shamrock-50 py-2">
                <Ionicons name="camera-outline" size={14} color="#1D9E75" />
                <Text className="font-sans-semibold text-xs text-shamrock-800">Log meal</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mt-5 border-t border-ash-grey-100 pt-4">
        <MacroProgressBars macros={macros} embedded />
      </View>
    </View>
  );
}
