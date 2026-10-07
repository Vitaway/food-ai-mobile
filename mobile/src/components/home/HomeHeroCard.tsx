import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { CalorieRing } from '@/components/home/CalorieRing';
import { WeekDaySelector } from '@/components/home/WeekDaySelector';
import { Text } from '@/components/ui/Text';
import { tf, useI18n } from '@/context/LocaleContext';
import { palette, semanticColors } from '@/design-system/colors';
import type { DailyDashboard } from '@/types';

type HomeHeroCardProps = {
  dashboard: DailyDashboard;
  dayHeading: string;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onOpenCalendar: () => void;
  onPressDetail: () => void;
};

export function HomeHeroCard({
  dashboard,
  dayHeading,
  selectedDate,
  onSelectDate,
  onOpenCalendar,
  onPressDetail,
}: HomeHeroCardProps) {
  const { t } = useI18n();
  const left = Math.max(dashboard.calorieTarget - dashboard.caloriesConsumed, 0);

  return (
    <View
      className="mb-2 overflow-hidden rounded-[28px]"
      style={{
        shadowColor: palette['blue-spruce'][900],
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 8,
      }}>
      <View
        style={{
          backgroundColor: semanticColors.primary,
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 16,
        }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
              <Ionicons name="flame" size={14} color="#ffffff" />
              <Text className="font-sans-bold text-xs text-white">
                {dashboard.streakDays > 0
                  ? tf(t.home.dayStreak, { n: dashboard.streakDays })
                  : t.home.startStreak}
              </Text>
            </View>
            <Text className="text-sm font-sans-medium text-white/75">{dayHeading}</Text>
          </View>
          <Pressable
            onPress={onPressDetail}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-90">
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center gap-4">
          <CalorieRing
            consumed={dashboard.caloriesConsumed}
            confirmed={dashboard.caloriesConfirmed}
            estimate={dashboard.caloriesEstimate}
            target={dashboard.calorieTarget}
            size={118}
            compact
            tone="light"
          />
          <View className="min-w-0 flex-1 gap-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-shamrock-500" />
                <Text className="text-sm text-white/85">{t.home.confirmed}</Text>
              </View>
              <Text className="font-sans-bold text-white">{dashboard.caloriesConfirmed}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-cinnamon-wood-400" />
                <Text className="text-sm text-white/85">{t.home.estimate}</Text>
              </View>
              <Text className="font-sans-bold text-white">{dashboard.caloriesEstimate}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-white/30" />
                <Text className="text-sm text-white/85">{t.home.leftToday}</Text>
              </View>
              <Text className="font-sans-bold text-white">{left}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          {(
            [
              ['protein', dashboard.macrosConsumed.proteinG, dashboard.macros.proteinG, '#1d9e75'],
              ['carbs', dashboard.macrosConsumed.carbsG, dashboard.macros.carbsG, '#efa436'],
              ['fat', dashboard.macrosConsumed.fatG, dashboard.macros.fatG, '#b54e24'],
            ] as const
          ).map(([key, used, goal, color]) => {
            const pct = goal > 0 ? Math.min(100, Math.round((used / goal) * 100)) : 0;
            const label =
              key === 'protein' ? t.macros.protein : key === 'carbs' ? t.macros.carbs : t.macros.fat;
            return (
              <View key={key} className="flex-1">
                <Text className="text-[11px] font-sans-semibold text-white/70">{label}</Text>
                <Text className="mt-0.5 font-sans-bold text-sm text-white">
                  {used}
                  <Text className="font-sans-medium text-white/60"> / {goal} g</Text>
                </Text>
                <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-4 overflow-hidden rounded-2xl bg-white/12 px-3 py-3">
          <View className="mb-2 flex-row items-center justify-between px-1">
            <Text className="font-sans-semibold text-sm text-white">{t.home.thisWeek}</Text>
            <Pressable onPress={onOpenCalendar} hitSlop={8}>
              <Text className="font-sans-medium text-xs text-white/90 underline">{t.home.calendar}</Text>
            </Pressable>
          </View>
          <WeekDaySelector
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            variant="featured"
            className="mt-0"
          />
        </View>
      </View>
    </View>
  );
}
