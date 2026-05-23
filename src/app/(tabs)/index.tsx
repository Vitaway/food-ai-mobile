import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import {
  CollapsibleHomeHeader,
  HOME_WEEK_DAY_BAR_CLEARANCE,
  HomeWeekDayBar,
  useHomeHeaderLayout,
  useHomeSheetPosition,
} from '@/components/home/CollapsibleHomeHeader';
import { MealTimeline } from '@/components/home/MealTimeline';
import { MacroPills } from '@/components/ui/PillOption';
import { ContentSheet } from '@/components/ui/GradientHeader';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { useMeals } from '@/context/MealsContext';
import { useDashboard } from '@/hooks/useDashboard';
import { formatDisplayDate, todayKey } from '@/utils/dates';

export default function HomeScreen() {
  const router = useRouter();
  const { addWater } = useMeals();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const { dashboard, timeline, displayName } = useDashboard(selectedDate);
  const calorieProgress = Math.round((dashboard.caloriesConsumed / dashboard.calorieTarget) * 100);
  const isToday = selectedDate === todayKey();
  const { collapsedHeight, expandedHeight } = useHomeHeaderLayout();

  const scrollY = useSharedValue(0);
  const sheetPositionStyle = useHomeSheetPosition(scrollY, expandedHeight, collapsedHeight);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = Math.max(0, event.contentOffset.y);
    },
  });

  const handleAddMeal = useCallback(() => {
    router.push('/(tabs)/log');
  }, [router]);

  const handleMealPress = useCallback(
    (mealId: string) => {
      router.push(`/meal/${mealId}`);
    },
    [router],
  );

  const handleAddWater = useCallback(async () => {
    await addWater(250, selectedDate);
  }, [addWater, selectedDate]);

  return (
    <View className="flex-1" style={{ backgroundColor: palette['blue-spruce'][400] }}>
      <CollapsibleHomeHeader
        scrollY={scrollY}
        displayName={displayName}
        calorieProgress={calorieProgress}
        isToday={isToday}
        healthScore={dashboard.healthScore}
        streakDays={dashboard.streakDays}
        expandedHeight={expandedHeight}
        collapsedHeight={collapsedHeight}
      />

      <HomeWeekDayBar
        scrollY={scrollY}
        expandedHeight={expandedHeight}
        collapsedHeight={collapsedHeight}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <Animated.View
        className="min-h-0 flex-1"
        style={[{ zIndex: 2, overflow: 'visible' }, sheetPositionStyle]}>
        <ContentSheet className="pt-0">
          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={{
              paddingTop: HOME_WEEK_DAY_BAR_CLEARANCE,
              paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
            }}>
            <MacroPills
              macros={[
              { label: 'Protein', value: `${dashboard.macrosConsumed.proteinG}g`, colorClass: 'bg-shamrock-500' },
              { label: 'Carbs', value: `${dashboard.macrosConsumed.carbsG}g`, colorClass: 'bg-blue-spruce-500' },
              { label: 'Fats', value: `${dashboard.macrosConsumed.fatG}g`, colorClass: 'bg-cinnamon-wood-400' },
              {
                label: 'Water',
                value: `${dashboard.waterMl}ml`,
                colorClass: 'bg-muted-teal-500',
                onPress: isToday ? handleAddWater : undefined,
              },
              ]}
            />

            {isToday ? (
              <Pressable onPress={handleAddWater} className="mb-4 mt-1">
                <Text className="text-center text-sm text-blue-spruce-600">+ Add 250 ml water</Text>
              </Pressable>
            ) : null}

            <MealTimeline
              dateLabel={isToday ? `Today, ${formatDisplayDate()}` : formatDisplayDate(new Date(selectedDate))}
              summary={`${dashboard.caloriesConsumed} / ${dashboard.calorieTarget} kcal · ${timeline.filter((m) => m.logged).length}/${timeline.length} meals logged`}
              meals={timeline}
              onMealPress={handleMealPress}
              onAddMeal={handleAddMeal}
            />
          </Animated.ScrollView>
        </ContentSheet>
      </Animated.View>
    </View>
  );
}
