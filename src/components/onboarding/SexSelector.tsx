import { CheckCircle } from 'iconoir-react-native';
import { Pressable, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import {
  onboardingOptionCard,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import { ICONOIR_DEFAULTS, SEX_OPTION_ICONS } from '@/constants/onboardingIcons';
import type { UserSex } from '@/types';

export const SEX_OPTIONS: {
  id: UserSex;
  label: string;
  iconKey: keyof typeof SEX_OPTION_ICONS;
}[] = [
  { id: 'male', label: 'Male', iconKey: 'male' },
  { id: 'female', label: 'Female', iconKey: 'female' },
  { id: 'other', label: 'Other', iconKey: 'other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', iconKey: 'prefer_not_to_say' },
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

        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.id)}
            className={onboardingOptionCard(selected, 'green')}>
            <View className="flex-row items-center gap-4">
              <View
                className={`h-11 w-11 items-center justify-center rounded-2xl ${
                  selected ? 'bg-shamrock-600' : 'bg-shamrock-50'
                }`}>
                <IconoirIcon
                  icon={SEX_OPTION_ICONS[option.iconKey]}
                  size={22}
                  color={selected ? ICONOIR_DEFAULTS.colorOnDark : ICONOIR_DEFAULTS.color}
                />
              </View>
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
