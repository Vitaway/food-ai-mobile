import { Pressable, View } from 'react-native';

import { OnboardingStepHero } from '@/components/onboarding/OnboardingStepHero';
import { Text } from '@/components/ui/Text';
import { getOnboardingStepHero } from '@/constants/onboardingStepImages';
import {
  onboardingOptionSubtitle,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import { MEALS_PER_DAY_OPTIONS } from '@/constants/profileOptions';
import { palette } from '@/design-system/colors';
import type { UserSex } from '@/types';

const MEAL_RHYTHM_META: Record<
  (typeof MEALS_PER_DAY_OPTIONS)[number],
  { label: string; hint: string }
> = {
  3: { label: 'Classic', hint: 'Breakfast, lunch & dinner' },
  4: { label: 'Steady', hint: 'Three meals plus a snack' },
  5: { label: 'Active', hint: 'More frequent fueling' },
  6: { label: 'Frequent', hint: 'Smaller meals through the day' },
};

function MealDots({ count, selected }: { count: number; selected: boolean }) {
  return (
    <View className="mt-3 flex-row justify-center gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: selected ? palette['cinnamon-wood'][400] : palette['ash-grey'][300],
          }}
        />
      ))}
    </View>
  );
}

type MealsPerDayPickerProps = {
  value: number;
  onChange: (count: number) => void;
  sex: UserSex;
};

export function MealsPerDayPicker({ value, onChange, sex }: MealsPerDayPickerProps) {
  return (
    <View>
      <View className="flex-row flex-wrap gap-3">
        {MEALS_PER_DAY_OPTIONS.map((count) => {
          const selected = value === count;
          const meta = MEAL_RHYTHM_META[count];

          return (
            <Pressable
              key={count}
              onPress={() => onChange(count)}
              style={{ width: '47%' }}
              className={`rounded-3xl border px-4 py-4 ${
                selected
                  ? 'border-cinnamon-wood-400 bg-cinnamon-wood-50'
                  : 'border-ash-grey-200 bg-white'
              }`}>
              <Text
                className={`text-center text-3xl font-sans-bold ${onboardingOptionTitle(selected, 'orange')}`}>
                {count}
              </Text>
              <Text className={`text-center text-sm font-sans-medium ${onboardingOptionTitle(selected, 'orange')}`}>
                meals
              </Text>
              <MealDots count={count} selected={selected} />
              <Text
                className={`mt-3 text-center text-xs font-sans-semibold ${onboardingOptionTitle(selected, 'orange')}`}>
                {meta.label}
              </Text>
              <Text className={`mt-1 text-center text-xs leading-4 ${onboardingOptionSubtitle(selected, 'orange')}`}>
                {meta.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <OnboardingStepHero source={getOnboardingStepHero('habits', sex)} placement="below" />
    </View>
  );
}
