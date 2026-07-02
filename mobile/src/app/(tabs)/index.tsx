import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { HomeWaterCard } from '@/components/home/HomeWaterCard';
import { HomeHeroCard } from '@/components/home/HomeHeroCard';
import { HomeQuickCategories } from '@/components/home/HomeQuickCategories';
import { HomeQuickLogBar } from '@/components/home/HomeQuickLogBar';
import { HomeTodaySection } from '@/components/home/HomeTodaySection';
import { MacroProgressBars } from '@/components/home/MacroProgressBars';
import { isPipelineActive } from '@/constants/mealStatus';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { MealTypeId } from '@/constants/mealTypes';
import { formatDayHeading, formatDisplayDate, parseDateKey, todayKey } from '@/utils/dates';
import { setLogMealTypeIntent, setLogMethodIntent } from '@/utils/logIntent';

export default function HomeScreen() {
  const { push } = useNavigateOnce();
  const isFocused = useIsFocused();
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const { dashboard, timeline, mealCount, displayName } = useDashboard(selectedDate);
  const notificationUnread = useNotificationUnreadCount();
  const firstName = useMemo(() => displayName.trim().split(/\s+/)[0] || 'there', [displayName]);

  const isToday = selectedDate === todayKey();
  const dayHeading = formatDayHeading(selectedDate);
  const headerDateLabel = formatDisplayDate(isToday ? new Date() : parseDateKey(selectedDate));
  const mealsTitle = `${dayHeading}'s meals`;

  const handleAddMeal = useCallback(
    (mealTypeId?: MealTypeId) => {
      if (mealTypeId) setLogMealTypeIntent(mealTypeId);
      push('/(tabs)/log');
    },
    [push],
  );

  const handleMealPress = useCallback(
    (mealId: string) => {
      push(`/meal/${mealId}`);
    },
    [push],
  );

  const handleOpenNotifications = useCallback(() => {
    push('/notifications');
  }, [push]);

  const handleOpenProfile = useCallback(() => {
    push('/(tabs)/profile');
  }, [push]);

  const onAddMeal = useSinglePress(handleAddMeal);
  const onMealPress = useSinglePress(handleMealPress);
  const onOpenNotifications = useSinglePress(handleOpenNotifications);
  const onOpenProfile = useSinglePress(handleOpenProfile);
  const onOpenScan = useSinglePress(() => {
    setLogMethodIntent('camera');
    push('/(tabs)/log');
  });
  const onOpenDescribe = useSinglePress(() => {
    setLogMethodIntent('describe');
    push('/(tabs)/log');
  });
  const onOpenInsights = useSinglePress(() => push('/(tabs)/analytics'));
  const onOpenWater = useSinglePress(() => push('/water'));

  const activePipelineCount = useMemo(
    () => meals.filter((meal) => isPipelineActive(meal.status)).length,
    [meals],
  );

  const macroBars = useMemo(
    () => [
      {
        label: 'Protein',
        consumed: dashboard.macrosConsumed.proteinG,
        target: dashboard.macros.proteinG,
        colorClass: 'bg-shamrock-500',
      },
      {
        label: 'Carbs',
        consumed: dashboard.macrosConsumed.carbsG,
        target: dashboard.macros.carbsG,
        colorClass: 'bg-blue-spruce-500',
      },
      {
        label: 'Fat',
        consumed: dashboard.macrosConsumed.fatG,
        target: dashboard.macros.fatG,
        colorClass: 'bg-cinnamon-wood-400',
      },
      {
        label: 'Fiber',
        consumed: dashboard.macrosConsumed.fiberG,
        target: dashboard.macros.fiberG,
        colorClass: 'bg-muted-teal-500',
      },
    ],
    [dashboard.macros, dashboard.macrosConsumed],
  );

  const onOpenHealth = useSinglePress(() => push('/profile/health'));

  return (
    <View className="flex-1 bg-white">
      {isFocused ? <StatusBar style="light" /> : null}

      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <GradientHeaderTitle>{`Hello, ${firstName}`}</GradientHeaderTitle>
            <Text className="mt-1 text-base text-white/85">{headerDateLabel}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onOpenNotifications}
              className="relative h-11 w-11 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              {notificationUnread > 0 ? (
                <View className="absolute -right-1 -top-1 min-w-[18px] items-center rounded-full bg-cinnamon-wood-400 px-1.5 py-0.5">
                  <Text className="text-[10px] font-sans-semibold text-white">
                    {Math.min(notificationUnread, 9)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={onOpenProfile} className="h-11 w-11 overflow-hidden rounded-full bg-white/20">
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center bg-shamrock-500">
                  <Text className="font-sans-semibold text-sm text-white">{firstName.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </GradientHeader>

      <ContentSheet
        className="pt-5"
        style={{ backgroundColor: palette['ash-grey'][50] }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-4">
          <HomeQuickLogBar onPress={() => onAddMeal?.()} />

          <HomeQuickCategories
            onScan={() => onOpenScan?.()}
            onDescribe={() => onOpenDescribe?.()}
            onWater={() => onOpenWater?.()}
            onInsights={() => onOpenInsights?.()}
          />

          <HomeWaterCard
            waterMl={dashboard.waterMl}
            waterTargetMl={dashboard.waterTargetMl}
            onPress={() => onOpenWater?.()}
          />

          <HomeHeroCard
            dashboard={dashboard}
            dayHeading={dayHeading}
            selectedDate={selectedDate}
            lastMeal={dashboard.lastMeal}
            onSelectDate={setSelectedDate}
            onOpenCalendar={() => onOpenHealth?.()}
            onPressDetail={() => onOpenHealth?.()}
          />

          {activePipelineCount > 0 ? (
            <Pressable
              onPress={onOpenNotifications}
              className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3"
              style={{
                shadowColor: '#1a1c17',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 2,
              }}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-spruce-50">
                <Ionicons name="time-outline" size={20} color="#023459" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-neutral-900">
                  {activePipelineCount} meal{activePipelineCount === 1 ? '' : 's'} in progress
                </Text>
                <Text className="mt-0.5 text-sm text-neutral-500">Tap for status updates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#848a75" />
            </Pressable>
          ) : null}

          <View
            className="rounded-3xl bg-white p-5"
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.05,
              shadowRadius: 16,
              elevation: 2,
            }}>
            <MacroProgressBars macros={macroBars} embedded />
          </View>

          <HomeTodaySection
            title={mealsTitle}
            mealCount={mealCount}
            meals={timeline}
            onMealPress={(mealId) => onMealPress?.(mealId)}
            onAddMeal={() => onAddMeal?.()}
          />
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
