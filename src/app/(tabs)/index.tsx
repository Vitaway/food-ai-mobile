import { ScrollView, View } from 'react-native';

import { HealthScoreRing } from '@/components/home/HealthScoreRing';
import { MealTimeline, type MealTimelineItem } from '@/components/home/MealTimeline';
import { MacroPills } from '@/components/ui/PillOption';
import { WeekDaySelector } from '@/components/home/WeekDaySelector';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import type { DailyDashboard } from '@/types';

const placeholderDashboard: DailyDashboard = {
  date: new Date().toISOString(),
  caloriesConsumed: 1240,
  calorieTarget: 2100,
  macros: {
    calories: 2100,
    proteinG: 140,
    carbsG: 220,
    fatG: 70,
    fiberG: 30,
  },
  macrosConsumed: {
    proteinG: 62,
    carbsG: 148,
    fatG: 38,
    fiberG: 12,
  },
  waterMl: 750,
  waterTargetMl: 2450,
  healthScore: 78,
  streakDays: 3,
};

const todayMeals: MealTimelineItem[] = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    time: '09:01',
    items: ['Oats', 'Banana', 'Greek yogurt'],
    logged: true,
    calories: 420,
  },
  {
    id: 'lunch',
    label: 'Lunch',
    logged: false,
  },
  {
    id: 'dinner',
    label: 'Dinner',
    logged: false,
  },
];

function formatTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const data = placeholderDashboard;
  const calorieProgress = Math.round((data.caloriesConsumed / data.calorieTarget) * 100);

  return (
    <View className="flex-1 bg-blue-spruce-500">
      <GradientHeader>
        <Text className="font-sans-bold text-3xl text-white">Hello there</Text>
        <Text className="mt-1 text-base text-white/85">
          You&apos;re {calorieProgress}% toward today&apos;s calorie goal
        </Text>

        <HealthScoreRing score={data.healthScore} subtitle={`${data.streakDays}-day streak`} />
        <WeekDaySelector />
      </GradientHeader>

      <ContentSheet>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}>
          <MacroPills
            macros={[
              { label: 'Protein', value: `${data.macrosConsumed.proteinG}g`, colorClass: 'bg-shamrock-500' },
              { label: 'Carbs', value: `${data.macrosConsumed.carbsG}g`, colorClass: 'bg-blue-spruce-500' },
              { label: 'Fats', value: `${data.macrosConsumed.fatG}g`, colorClass: 'bg-cinnamon-wood-400' },
              { label: 'Water', value: `${data.waterMl}ml`, colorClass: 'bg-muted-teal-500' },
            ]}
          />

          <MealTimeline
            dateLabel={`Today, ${formatTodayLabel()}`}
            summary={`${data.caloriesConsumed} / ${data.calorieTarget} kcal · ${todayMeals.filter((m) => m.logged).length}/${todayMeals.length} meals logged`}
            meals={todayMeals}
          />
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
