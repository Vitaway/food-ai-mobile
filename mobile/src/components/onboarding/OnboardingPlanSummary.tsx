import { View } from 'react-native';

import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { OnboardingStepHero } from '@/components/onboarding/OnboardingStepHero';
import { Text } from '@/components/ui/Text';
import { getOnboardingStepHero } from '@/constants/onboardingStepImages';
import { formatActivityLevel, formatHealthGoal } from '@/constants/profileOptions';
import { palette } from '@/design-system/colors';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';

type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type OnboardingPlanSummaryProps = {
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

const MACRO_TILES: {
  key: keyof Pick<MacroTargets, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>;
  label: string;
  bg: string;
  valueColor: string;
}[] = [
  { key: 'proteinG', label: 'Protein', bg: palette.shamrock[50], valueColor: palette.shamrock[800] },
  { key: 'carbsG', label: 'Carbs', bg: palette['blue-spruce'][50], valueColor: palette['blue-spruce'][800] },
  { key: 'fatG', label: 'Fat', bg: palette['cinnamon-wood'][50], valueColor: palette['cinnamon-wood'][800] },
  { key: 'fiberG', label: 'Fiber', bg: palette['ash-grey'][100], valueColor: palette['ash-grey'][900] },
];

export function OnboardingPlanSummary({
  macroTargets,
  bmr,
  tdee,
  waterTargetMl,
  goal,
  activityLevel,
  targetWeightKg,
  weightKg,
  goalPace,
  mealsPerDay,
  sex,
}: OnboardingPlanSummaryProps) {
  const goalLabel = formatHealthGoal(goal);
  const activityLabel = formatActivityLevel(activityLevel);

  return (
    <View>
      <OnboardingCard className="border-shamrock-200 bg-shamrock-50">
        <Text className="font-sans-medium text-sm text-shamrock-700">Daily calories</Text>
        <Text className="mt-1 font-sans-bold text-4xl text-cinnamon-wood-400">
          {macroTargets.calories} kcal
        </Text>
        <Text className="mt-3 text-sm leading-5 text-shamrock-800">
          BMR {bmr} · TDEE {tdee} · Water {waterTargetMl} ml
        </Text>
        {targetWeightKg !== weightKg ? (
          <Text className="mt-2 text-sm text-shamrock-700">
            Target {targetWeightKg} kg · {goalPace} pace · {mealsPerDay} meals/day
          </Text>
        ) : (
          <Text className="mt-2 text-sm text-shamrock-700">
            {mealsPerDay} meals/day · {goalPace} pace
          </Text>
        )}
      </OnboardingCard>

      <View className="mt-4 flex-row flex-wrap gap-3">
        {MACRO_TILES.map((tile) => (
          <View
            key={tile.key}
            style={{ width: '47%', backgroundColor: tile.bg }}
            className="rounded-2xl px-4 py-4">
            <Text className="text-xs text-neutral-500">{tile.label}</Text>
            <Text className="mt-1 font-sans-bold text-2xl" style={{ color: tile.valueColor }}>
              {macroTargets[tile.key]}g
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-full border border-shamrock-200 bg-shamrock-50 px-3 py-1.5">
          <Text className="text-xs font-sans-medium text-shamrock-800">{goalLabel}</Text>
        </View>
        <View className="rounded-full border border-blue-spruce-200 bg-blue-spruce-50 px-3 py-1.5">
          <Text className="text-xs font-sans-medium text-blue-spruce-800">{activityLabel}</Text>
        </View>
      </View>

      <OnboardingStepHero source={getOnboardingStepHero('summary', sex)} placement="below" />
    </View>
  );
}
