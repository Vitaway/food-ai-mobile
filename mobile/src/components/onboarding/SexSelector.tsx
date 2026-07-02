import { CheckCircle } from 'iconoir-react-native';
import { Image, Pressable, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import {
  onboardingOptionCard,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import { ICONOIR_DEFAULTS } from '@/constants/onboardingIcons';
import { SEX_OPTION_IMAGES } from '@/constants/sexOptionImages';
import type { UserSex } from '@/types';

export const SEX_OPTIONS: {
  id: UserSex;
  label: string;
}[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

type SexSelectorProps = {
  value: UserSex;
  onChange: (value: UserSex) => void;
};

export function SexSelector({ value, onChange }: SexSelectorProps) {
  return (
    <View className="gap-3">
      {SEX_OPTIONS.map((option) => {
        const selected = value === option.id;
        if (!option.id) return null;

        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.id)}
            className={onboardingOptionCard(selected, 'green')}>
            <View className="flex-row items-center gap-4">
              <Image
                source={SEX_OPTION_IMAGES[option.id]}
                style={{ width: 56, height: 56, borderRadius: 16 }}
                className="bg-ash-grey-100"
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <Text className={`flex-1 font-sans-semibold text-base ${onboardingOptionTitle(selected, 'green')}`}>
                {option.label}
              </Text>
              {selected ? <IconoirIcon icon={CheckCircle} size={22} color={ICONOIR_DEFAULTS.color} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function formatUserSex(sex: UserSex) {
  if (sex === null) return 'Not specified';
  if (sex === 'prefer_not_to_say') return 'Prefer not to say';
  if (sex === 'other') return 'Other';
  return sex.charAt(0).toUpperCase() + sex.slice(1);
}
