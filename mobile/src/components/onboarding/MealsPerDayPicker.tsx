import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
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
  1: { label: 'OMAD', hint: 'One meal a day' },
  2: { label: 'Light', hint: 'Two main meals' },
  3: { label: 'Classic', hint: 'Breakfast, lunch & dinner' },
  4: { label: 'Steady', hint: 'Three meals plus a snack' },
  5: { label: 'Active', hint: 'More frequent fueling' },
  6: { label: 'Frequent', hint: 'Smaller meals through the day' },
};

function MealDots({ count, selected }: { count: number; selected: boolean }) {
  return (
    <View className="mt-3 flex-row flex-wrap justify-center gap-1">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            width: 7,
            height: 7,
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
  sex?: UserSex;
};

export function MealsPerDayPicker({ value, onChange }: MealsPerDayPickerProps) {
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
              className={`rounded-2xl border px-3 py-3.5 ${
                selected
                  ? 'border-2 border-cinnamon-wood-400 bg-cinnamon-wood-400/15'
                  : 'border-blue-spruce-300/60 bg-blue-spruce-600/5'
              }`}>
              <Text
                className={`text-center text-3xl font-sans-bold ${onboardingOptionTitle(selected, 'orange')}`}>
                {count}
              </Text>
              <Text className={`text-center text-sm font-sans-medium ${onboardingOptionTitle(selected, 'orange')}`}>
                {count === 1 ? 'meal' : 'meals'}
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
    </View>
  );
}
