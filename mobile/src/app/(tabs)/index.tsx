import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { HomeWaterCard } from '@/components/home/HomeWaterCard';
import { HomeHeroCard } from '@/components/home/HomeHeroCard';
import { HomeQuickCategories } from '@/components/home/HomeQuickCategories';
import { HomeTodaySection } from '@/components/home/HomeTodaySection';
import {
  BestPlateTodayCard,
  pickBestPlateToday,
} from '@/components/home/BestPlateTodayCard';
import { MacroProgressBars } from '@/components/home/MacroProgressBars';
import { CoachingFeedCard } from '@/components/home/CoachingFeedCard';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { enteringCard } from '@/components/ui/motion';
import Animated from 'react-native-reanimated';
import { isPipelineActive } from '@/constants/mealStatus';
import {
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
} from '@/types/balancedPlate';
import { mealDisplayTitle } from '@/utils/mealDisplay';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { palette, semanticColors } from '@/design-system/colors';
import { useMeals } from '@/context/MealsContext';
import { tf, useI18n } from '@/context/LocaleContext';
import { useProfile } from '@/context/ProfileContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { MealTypeId } from '@/constants/mealTypes';
import { formatDayHeading, formatDisplayDate, parseDateKey, todayKey } from '@/utils/dates';
import { dateLocaleTag } from '@/i18n/locales';
import { macroLabel } from '@/utils/i18nLabels';
import { setLogMealTypeIntent, setLogMethodIntent } from '@/utils/logIntent';

export default function HomeScreen() {
  const { t, locale } = useI18n();
  const { push } = useNavigateOnce();
  const isFocused = useIsFocused();
  const { meals, refreshMeals } = useMeals();
  const { profile } = useProfile();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const { dashboard, timeline, mealCount, displayName } = useDashboard(selectedDate);
  const notificationUnread = useNotificationUnreadCount();
  const firstName = useMemo(
    () => displayName.trim().split(/\s+/)[0] || t.home.fallbackName,
    [displayName, t.home.fallbackName],
  );

  useFocusEffect(
    useCallback(() => {
      void refreshMeals();
    }, [refreshMeals]),
  );

  const isToday = selectedDate === todayKey();
  const dateTag = dateLocaleTag(locale);
  const dayHeading = formatDayHeading(selectedDate, {
    locale: dateTag,
    today: t.dates.today,
    yesterday: t.dates.yesterday,
  });
  const headerDateLabel = formatDisplayDate(
    isToday ? new Date() : parseDateKey(selectedDate),
    dateTag,
  );
  const mealsTitle = tf(t.home.mealsTitle, { day: dayHeading });

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
  const onOpenBarcode = useSinglePress(() => {
    setLogMethodIntent('barcode');
    push('/(tabs)/log');
  });
  const onOpenSearch = useSinglePress(() => {
    setLogMethodIntent('describe');
    push('/(tabs)/log');
  });
  const onOpenSpeak = useSinglePress(() => {
    setLogMethodIntent('speak');
    push('/(tabs)/log');
  });
  const onOpenWater = useSinglePress(() => push('/water'));
  const onOpenStory = useSinglePress(() => push('/story'));
  const onOpenInsights = useSinglePress(() => push('/(tabs)/analytics'));

  const activePipelineCount = useMemo(
    () => meals.filter((meal) => isPipelineActive(meal.status)).length,
    [meals],
  );

  const bestPlate = useMemo(() => {
    const dayMeals = meals.filter((meal) => meal.submittedAt.slice(0, 10) === selectedDate);
    return pickBestPlateToday(dayMeals, (meal) => {
      if (meal.balancedPlate) return meal.balancedPlate;
      const items = withInferredPlateGroups(meal.items ?? []);
      return resolveBalancedPlateForMeal({ mealType: meal.mealType, items });
    });
  }, [meals, selectedDate]);

  const bestPlateCard = useMemo(() => {
    if (!bestPlate) return null;
    const meal = meals.find((m) => m.id === bestPlate.id);
    return {
      ...bestPlate,
      mealName: meal ? mealDisplayTitle(meal, t) : bestPlate.mealName,
    };
  }, [bestPlate, meals, t]);

  const nutrientBars = useMemo(
    () => [
      {
        label: macroLabel(t, 'protein'),
        consumed: dashboard.macrosConsumed.proteinG,
        target: dashboard.macros.proteinG,
        colorClass: 'bg-shamrock-500',
      },
      {
        label: macroLabel(t, 'fiber'),
        consumed: dashboard.macrosConsumed.fiberG,
        target: dashboard.macros.fiberG,
        colorClass: 'bg-muted-teal-500',
      },
    ],
    [dashboard.macros, dashboard.macrosConsumed, t],
  );

  const onOpenHealth = useSinglePress(() => push('/profile/health'));
  const onOpenSelectedDay = useSinglePress(() => push(`/profile/day/${selectedDate}`));

  return (
    <View className="flex-1" style={{ backgroundColor: semanticColors.background }}>
      {isFocused ? <StatusBar style="light" /> : null}

      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-sans-semibold text-white/70">{headerDateLabel}</Text>
            <GradientHeaderTitle>{tf(t.home.hello, { name: firstName })}</GradientHeaderTitle>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onOpenNotifications}
              className="relative h-11 w-11 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              {notificationUnread > 0 ? (
                <View className="absolute -right-1 -top-1 min-w-[18px] items-center rounded-full bg-cinnamon-wood-400 px-1.5 py-0.5">
                  <Text className="text-[10px] font-sans-semibold text-blue-spruce-900">
                    {Math.min(notificationUnread, 9)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={onOpenProfile} className="h-11 w-11 overflow-hidden rounded-full bg-white/20">
              <ResolvedImage
                uri={profile?.avatarUrl}
                className="h-full w-full"
                resizeMode="cover"
                fallback={
                  <View className="h-full w-full items-center justify-center bg-shamrock-500">
                    <Text className="font-sans-semibold text-sm text-white">
                      {firstName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                }
              />
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
          <Animated.View entering={enteringCard(0)}>
            <FreePlanBanner />
          </Animated.View>

          <Animated.View entering={enteringCard(1)}>
            <HomeHeroCard
              dashboard={dashboard}
              dayHeading={dayHeading}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenCalendar={() => onOpenHealth?.()}
              onPressDetail={() => onOpenSelectedDay?.()}
            />
          </Animated.View>

          <Animated.View entering={enteringCard(2)}>
            <HomeQuickCategories
              onScan={() => onOpenScan?.()}
              onSpeak={() => onOpenSpeak?.()}
              onSearch={() => onOpenSearch?.()}
              onBarcode={() => onOpenBarcode?.()}
            />
          </Animated.View>

          {activePipelineCount > 0 ? (
            <Animated.View entering={enteringCard(3)}>
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
                <View className="h-10 w-10 items-center justify-center rounded-full bg-cinnamon-wood-50">
                  <Ionicons name="time-outline" size={20} color="#efa436" />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-semibold text-neutral-900">
                    {activePipelineCount === 1
                      ? t.home.pipelineOne
                      : tf(t.home.pipelineMany, { n: activePipelineCount })}
                  </Text>
                  <Text className="mt-0.5 text-sm text-neutral-500">{t.home.pipelineTap}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6b7a52" />
              </Pressable>
            </Animated.View>
          ) : null}

          <Animated.View entering={enteringCard(4)}>
            <View className="mb-2 flex-row items-center justify-between px-1">
              <Text className="font-sans-bold text-lg text-neutral-900">{mealsTitle}</Text>
              <Pressable onPress={() => onOpenInsights?.()} hitSlop={8}>
                <Text className="font-sans-semibold text-sm text-blue-spruce-600 underline">
                  {t.home.thisWeekLink}
                </Text>
              </Pressable>
            </View>
            {bestPlateCard ? (
              <BestPlateTodayCard
                plate={bestPlateCard}
                onPress={(mealId) => onMealPress?.(mealId)}
              />
            ) : null}
            <HomeTodaySection
              title=""
              mealCount={mealCount}
              meals={timeline}
              onMealPress={(mealId) => onMealPress?.(mealId)}
              onAddMeal={() => onAddMeal?.()}
            />
          </Animated.View>

          <Animated.View
            entering={enteringCard(5)}
            className="rounded-3xl bg-white p-5"
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.05,
              shadowRadius: 16,
              elevation: 2,
            }}>
            <Text className="mb-3 font-sans-bold text-lg text-neutral-900">
              {t.home.nutrientsThatMatter}
            </Text>
            <MacroProgressBars macros={nutrientBars} embedded />
          </Animated.View>

          <Animated.View entering={enteringCard(6)}>
            <HomeWaterCard
              waterMl={dashboard.waterMl}
              waterTargetMl={dashboard.waterTargetMl}
              onPress={() => onOpenWater?.()}
            />
          </Animated.View>

          <Animated.View entering={enteringCard(7)}>
            <Pressable
              onPress={() => onOpenStory?.()}
              className="flex-row items-center gap-3 overflow-hidden rounded-3xl bg-blue-spruce-600 px-4 py-4 active:opacity-90"
              style={{
                shadowColor: semanticColors.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 4,
              }}>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Ionicons name="play" size={22} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-lg text-white">{t.home.weekInFood}</Text>
                <Text className="mt-0.5 text-sm text-white/80">{t.home.weekInFoodHint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </Animated.View>

          <Animated.View entering={enteringCard(8)}>
            <CoachingFeedCard />
          </Animated.View>
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
