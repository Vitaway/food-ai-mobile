import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { formatActivityLevel, formatHealthGoal } from '@/constants/profileOptions';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';

type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type OnboardingPlanSummaryProps = {
  displayName?: string;
  avatarUrl?: string;
  macroTargets: MacroTargets;
  bmr: number;
  tdee: number;
  waterTargetMl: number;
  goal: HealthGoal;
  activityLevel: ActivityLevel;
  targetWeightKg: number;
  weightKg: number;
  goalPace: GoalPace;
  mealsPerDay: number;
  sex: UserSex;
};

const MACROS: { key: keyof Pick<MacroTargets, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>; label: string }[] = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'carbsG', label: 'Carbs' },
  { key: 'fatG', label: 'Fat' },
  { key: 'fiberG', label: 'Fiber' },
];

export function OnboardingPlanSummary({
  displayName,
  avatarUrl,
  macroTargets,
  waterTargetMl,
  goal,
  activityLevel,
  targetWeightKg,
  weightKg,
  goalPace,
  mealsPerDay,
}: OnboardingPlanSummaryProps) {
  const firstName = (displayName ?? '').trim().split(/\s+/)[0] || 'You';

  return (
    <View className="gap-5">
      <View className="items-center">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-blue-spruce-400/50 bg-blue-spruce-600/10">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={44} color="#1a3a2a" />
          )}
        </View>
        <Text className="mt-3 text-center font-sans-bold text-xl text-blue-spruce-900">
          {firstName}, your plan is ready
        </Text>
        <Text className="mt-1 text-center text-sm text-blue-spruce-700/70">
          Personalized daily targets
        </Text>
      </View>

      <View className="items-center rounded-[28px] bg-blue-spruce-800 px-6 py-6">
        <Text className="text-sm font-sans-medium text-blue-spruce-100">Daily calories</Text>
        <Text className="mt-1 font-sans-bold text-5xl text-white">{macroTargets.calories}</Text>
        <Text className="mt-1 text-sm text-blue-spruce-200">kcal · {waterTargetMl} ml water</Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {MACROS.map((tile) => (
          <View
            key={tile.key}
            style={{ width: '23%' }}
            className="items-center rounded-2xl border border-blue-spruce-300/50 bg-blue-spruce-600/5 px-1 py-3">
            <Text className="text-[11px] text-blue-spruce-700/70">{tile.label}</Text>
            <Text className="mt-1 font-sans-bold text-base text-blue-spruce-900">
              {macroTargets[tile.key]}g
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap justify-center gap-2">
        <View className="rounded-full bg-shamrock-50 px-3 py-1.5">
          <Text className="text-xs font-sans-medium text-shamrock-800">{formatHealthGoal(goal)}</Text>
        </View>
        <View className="rounded-full bg-blue-spruce-50 px-3 py-1.5">
          <Text className="text-xs font-sans-medium text-blue-spruce-800">
            {formatActivityLevel(activityLevel)}
          </Text>
        </View>
        <View className="rounded-full bg-ash-grey-100 px-3 py-1.5">
          <Text className="text-xs font-sans-medium text-neutral-700">
            {mealsPerDay} meals · {goalPace}
            {targetWeightKg !== weightKg ? ` · ${targetWeightKg} kg` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}
