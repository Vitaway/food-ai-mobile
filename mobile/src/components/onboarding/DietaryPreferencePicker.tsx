import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  DIETARY_PREFERENCES,
  DIETARY_PREFERENCE_META,
  type DietaryPreference,
} from '@/constants/profileOptions';

type DietaryPreferencePickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function DietaryPreferencePicker({ value, onChange }: DietaryPreferencePickerProps) {
  const toggle = (pref: DietaryPreference) => {
    onChange(value.includes(pref) ? value.filter((item) => item !== pref) : [...value, pref]);
  };

  return (
    <View className="flex-row flex-wrap gap-3">
      {DIETARY_PREFERENCES.map((pref) => {
        const selected = value.includes(pref);
        const meta = DIETARY_PREFERENCE_META[pref];
        return (
          <Pressable
            key={pref}
            onPress={() => toggle(pref)}
            style={{ width: '47%' }}
            className={`rounded-3xl border px-3 py-3.5 ${
              selected
                ? 'border-shamrock-500 bg-shamrock-50'
                : 'border-ash-grey-200 bg-ash-grey-50'
            }`}>
            <Text className="text-center text-[28px] leading-9">{meta.emoji}</Text>
            <Text
              className={`mt-2 text-center text-sm font-sans-semibold ${
                selected ? 'text-shamrock-800' : 'text-neutral-800'
              }`}>
              {pref}
            </Text>
            <Text
              className={`mt-0.5 text-center text-xs ${
                selected ? 'text-shamrock-700' : 'text-neutral-500'
              }`}>
              {meta.hint}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
