import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MonthCalendar } from '@/components/home/MonthCalendar';
import { MacroProgressBars } from '@/components/home/MacroProgressBars';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { formatActivityLevel, formatHealthGoal } from '@/constants/profileOptions';
import { formatUserSex } from '@/components/onboarding/SexSelector';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useDashboard } from '@/hooks/useDashboard';
import { formatDisplayDate, todayKey } from '@/utils/dates';

export default function HealthProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { meals } = useMeals();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const { dashboard } = useDashboard(selectedDate);

  const loggedDates = useMemo(() => {
    const keys = new Set<string>();
    for (const meal of meals) {
      if (meal.status === 'approved') {
        keys.add(meal.submittedAt.slice(0, 10));
      }
    }
    return keys;
  }, [meals]);

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

  const openEditHealth = (step?: string) => {
    if (step) {
      router.push({ pathname: '/profile/edit-health', params: { step } } as Href);
      return;
    }
    router.push('/profile/edit-health');
  };

  const planRows: Array<{ label: string; value: string; step: string }> = profile
    ? [
        { label: 'Goal', value: formatHealthGoal(profile.goal), step: 'goals' },
        { label: 'Activity', value: formatActivityLevel(profile.activityLevel), step: 'activity' },
        { label: 'Sex', value: formatUserSex(profile.sex), step: 'about' },
        { label: 'Age', value: `${profile.age}`, step: 'about' },
        { label: 'Height', value: `${profile.heightCm} cm`, step: 'body' },
        { label: 'Weight', value: `${profile.weightKg} kg`, step: 'body' },
        { label: 'Meals / day', value: `${profile.mealsPerDay ?? 3}`, step: 'habits' },
        { label: 'Calories', value: `${profile.macroTargets.calories.toLocaleString()} kcal`, step: 'review' },
      ]
    : [];

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Health profile" onBack={() => router.back()} />

      <StackScreenBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-3">
            <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} markedDates={loggedDates} />
          </View>

          <View className="rounded-2xl border border-ash-grey-100 p-4">
            <Text className="font-sans-semibold text-base text-neutral-900">
              {formatDisplayDate(new Date(selectedDate))}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Calories</Text>
                <Text className="mt-1 font-sans-semibold text-neutral-900">
                  {dashboard.caloriesConsumed}/{dashboard.calorieTarget}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Water</Text>
                <Text className="mt-1 font-sans-semibold text-neutral-900">
                  {dashboard.waterMl}/{dashboard.waterTargetMl}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-xs text-neutral-500">Score</Text>
                <Text className="mt-1 font-sans-semibold text-shamrock-700">{dashboard.healthScore}</Text>
              </View>
            </View>
          </View>

          <MacroProgressBars macros={macroBars} />

          {profile ? (
            <View className="rounded-2xl border border-ash-grey-100 p-4">
              <Text className="mb-1 font-sans-semibold text-base text-neutral-900">Your plan</Text>
              <Text className="mb-3 text-sm text-neutral-500">Tap any row to edit that section</Text>
              <View className="gap-1">
                {planRows.map((row) => (
                  <Pressable
                    key={row.label}
                    onPress={() => openEditHealth(row.step)}
                    className="flex-row items-center justify-between gap-4 rounded-xl px-2 py-2.5 active:bg-ash-grey-50">
                    <Text className="text-neutral-500">{row.label}</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="font-sans-medium text-neutral-900">{row.value}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Button label="Edit health profile" onPress={() => openEditHealth()} />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
