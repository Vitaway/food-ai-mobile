import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { HEALTH_GOAL_IMAGES } from '@/constants/healthGoalImages';
import {
  onboardingOptionCard,
  onboardingOptionSubtitle,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import { HEALTH_GOALS } from '@/constants/profileOptions';
import type { HealthGoal } from '@/types';

type HealthGoalPickerProps = {
  value: HealthGoal;
  onChange: (goal: HealthGoal) => void;
};

export function HealthGoalPicker({ value, onChange }: HealthGoalPickerProps) {
  return (
    <View className="gap-3">
      {HEALTH_GOALS.map((item) => {
        const selected = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            className={`overflow-hidden ${onboardingOptionCard(selected, 'green')}`}>
            <View className="flex-row items-center gap-4">
              <Image
                source={HEALTH_GOAL_IMAGES[item.id]}
                className="h-20 w-20 rounded-2xl bg-ash-grey-100"
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View className="min-w-0 flex-1">
                <Text className={`font-sans-semibold text-base ${onboardingOptionTitle(selected, 'green')}`}>
                  {item.label}
                </Text>
                <Text className={`mt-1 text-sm ${onboardingOptionSubtitle(selected, 'green')}`}>
                  {item.description}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
