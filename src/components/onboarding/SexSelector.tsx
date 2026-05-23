import { CheckCircle } from 'iconoir-react-native';
import { Pressable, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import { ICONOIR_DEFAULTS, SEX_OPTION_ICONS } from '@/constants/onboardingIcons';
import type { UserSex } from '@/types';

export const SEX_OPTIONS: {
  id: UserSex;
  label: string;
  iconKey: keyof typeof SEX_OPTION_ICONS;
}[] = [
  { id: null, label: 'Optional', iconKey: 'optional' },
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
            className={`flex-row items-center gap-4 rounded-3xl border px-5 py-4 ${
              selected ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-200 bg-ash-grey-50'
            }`}>
            <View
              className={`h-11 w-11 items-center justify-center rounded-2xl ${
                selected ? 'bg-blue-spruce-600' : 'bg-white'
              }`}>
              <IconoirIcon
                icon={SEX_OPTION_ICONS[option.iconKey]}
                size={22}
                color={selected ? ICONOIR_DEFAULTS.colorOnDark : ICONOIR_DEFAULTS.color}
              />
            </View>
            <Text className={`flex-1 font-sans-semibold text-base ${selected ? 'text-blue-spruce-800' : 'text-neutral-800'}`}>
              {option.label}
            </Text>
            {selected ? <IconoirIcon icon={CheckCircle} size={22} color={ICONOIR_DEFAULTS.color} /> : null}
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
