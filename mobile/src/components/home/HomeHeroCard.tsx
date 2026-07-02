import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { CalorieRing } from '@/components/home/CalorieRing';
import { WeekDaySelector } from '@/components/home/WeekDaySelector';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import type { DailyDashboard, MealSubmission } from '@/types';

type HomeHeroCardProps = {
  dashboard: DailyDashboard;
  dayHeading: string;
  selectedDate: string;
  lastMeal?: MealSubmission;
  onSelectDate: (dateKey: string) => void;
  onOpenCalendar: () => void;
  onPressDetail: () => void;
};

export function HomeHeroCard({
  dashboard,
  dayHeading,
  selectedDate,
  lastMeal,
  onSelectDate,
  onOpenCalendar,
  onPressDetail,
}: HomeHeroCardProps) {
  const calorieProgress =
    dashboard.calorieTarget > 0
      ? Math.round((dashboard.caloriesConsumed / dashboard.calorieTarget) * 100)
      : 0;

  return (
    <View
      className="mb-6 overflow-hidden rounded-[28px]"
      style={{
        shadowColor: palette['blue-spruce'][900],
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 8,
      }}>
      <View
        style={{
          backgroundColor: palette['blue-spruce'][600],
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
        }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1 rounded-full bg-cinnamon-wood-300 px-2.5 py-1">
              <Ionicons name="flame" size={14} color="#023459" />
              <Text className="font-sans-bold text-xs text-blue-spruce-900">
                {dashboard.streakDays > 0 ? `${dashboard.streakDays} day streak` : 'Start streak'}
              </Text>
            </View>
            <View className="rounded-full bg-white/20 px-2.5 py-1">
              <Text className="font-sans-semibold text-xs text-white">Health {dashboard.healthScore}</Text>
            </View>
          </View>

          <Pressable
            onPress={onPressDetail}
            className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-90">
            <Ionicons name="arrow-up-outline" size={20} color="#023459" style={{ transform: [{ rotate: '45deg' }] }} />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-sm font-sans-medium text-white/80">{dayHeading} · Daily plan</Text>
            <Text className="mt-1 font-sans-bold text-4xl text-white">{dashboard.caloriesConsumed}</Text>
            <Text className="mt-0.5 text-base text-white/85">
              of {dashboard.calorieTarget} kcal · {calorieProgress}%
            </Text>
            <Text className="mt-2 text-sm text-white/70">
              Water {dashboard.waterMl}/{dashboard.waterTargetMl} ml
            </Text>
          </View>

          <View className="items-center">
            {lastMeal?.imageUrl ? (
              <View className="h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-white/30">
                <Image source={{ uri: lastMeal.imageUrl }} className="h-full w-full" resizeMode="cover" />
              </View>
            ) : (
              <CalorieRing
                consumed={dashboard.caloriesConsumed}
                target={dashboard.calorieTarget}
                size={100}
                compact
                tone="light"
              />
            )}
          </View>
        </View>

        <View className="mt-5 overflow-hidden rounded-2xl bg-white/15 px-3 py-3">
          <View className="mb-2 flex-row items-center justify-between px-1">
            <Text className="font-sans-semibold text-sm text-white">This week</Text>
            <Pressable onPress={onOpenCalendar} hitSlop={8}>
              <Text className="font-sans-medium text-xs text-white/90 underline">Calendar</Text>
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
