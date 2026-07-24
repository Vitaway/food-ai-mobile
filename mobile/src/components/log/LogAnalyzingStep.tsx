import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
import { formatDiameterCm } from '@/utils/formatDiameter';

export type MealAnalyzePhase = 'plate' | 'food';

type LogAnalyzingStepProps = {
  phase?: MealAnalyzePhase;
  variant?: 'photo' | 'text' | 'title';
  plateDetected?: boolean;
  containerType?: PlateContainerType | null;
  plateDiameterCm?: number | null;
  plateDetectionError?: string | null;
};

type StepState = 'pending' | 'active' | 'done' | 'skipped';

function stepIcon(state: StepState) {
  if (state === 'done') {
    return <Ionicons name="checkmark-circle" size={22} color="#1D9E75" />;
  }
  if (state === 'skipped') {
    return <Ionicons name="remove-circle-outline" size={22} color="#9ca3af" />;
  }
  if (state === 'active') {
    return <ActivityIndicator size="small" color="#1D9E75" />;
  }
  return <Ionicons name="ellipse-outline" size={22} color="#d1d5db" />;
}

function plateStepState(phase: MealAnalyzePhase, plateDetected: boolean, error: string | null): StepState {
  if (phase === 'plate') return 'active';
  if (plateDetected) return 'done';
  if (error) return 'skipped';
  return 'skipped';
}

export function LogAnalyzingStep({
  phase = 'food',
  variant = 'photo',
  plateDetected = false,
  containerType = null,
  plateDiameterCm = null,
  plateDetectionError = null,
}: LogAnalyzingStepProps) {
  if (variant === 'title') {
    return (
      <View className="py-4">
        <LogCard className="items-center py-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-shamrock-100">
            <ActivityIndicator size="large" color="#1D9E75" />
          </View>
          <Text className="mt-6 font-sans-bold text-xl text-neutral-900">Naming your meal</Text>
          <Text className="mt-2 px-4 text-center text-sm leading-5 text-neutral-500">
            AI is writing a short dish title for your food log. Your coach will confirm nutrition next.
          </Text>
        </LogCard>
      </View>
    );
  }

  const dishLabel = containerType === 'bowl' ? 'bowl' : containerType === 'plate' ? 'plate' : 'dish';
  const plateState = plateStepState(phase, plateDetected, plateDetectionError);
  const foodState: StepState = phase === 'food' ? 'active' : 'pending';

  const plateDetail =
    plateState === 'done' && plateDiameterCm != null
      ? `${dishLabel.charAt(0).toUpperCase() + dishLabel.slice(1)} ${formatDiameterCm(plateDiameterCm)} detected`
      : plateState === 'skipped'
        ? 'No dish size — portions estimated from the photo'
        : 'Checking dish size for portion math…';

  const foodDetail =
    foodState === 'active'
      ? 'Reading the photo, listing foods, and calculating macros…'
      : 'Identify ingredients and estimate nutrition';

  return (
    <View className="py-4">
      <LogCard className="items-center py-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-shamrock-100">
          <Ionicons name="sparkles" size={36} color="#1D9E75" />
        </View>
        <Text className="mt-6 font-sans-bold text-xl text-neutral-900">Analyzing your meal</Text>
        <Text className="mt-2 px-4 text-center text-sm leading-5 text-neutral-500">
          {variant === 'photo'
            ? 'One tap — AI measures your dish, identifies food, and calculates nutrition.'
            : 'AI is estimating ingredients and nutrition from your description.'}
        </Text>
      </LogCard>

      <LogCard className="mt-4">
        <Text className="mb-4 font-sans-semibold text-base text-neutral-900">Progress</Text>

        {variant === 'photo' ? (
          <View className="flex-row gap-3">
            {stepIcon(plateState)}
            <View className="mb-5 flex-1">
              <Text
                className={`font-sans-semibold text-sm ${plateState === 'active' ? 'text-shamrock-700' : 'text-neutral-900'}`}>
                Measure dish size
              </Text>
              <Text className="mt-0.5 text-sm leading-5 text-neutral-500">{plateDetail}</Text>
            </View>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          {stepIcon(foodState)}
          <View className="flex-1">
            <Text
              className={`font-sans-semibold text-sm ${foodState === 'active' ? 'text-shamrock-700' : 'text-neutral-900'}`}>
              Identify food & calculate
            </Text>
            <Text className="mt-0.5 text-sm leading-5 text-neutral-500">{foodDetail}</Text>
          </View>
        </View>
      </LogCard>
    </View>
  );
}
