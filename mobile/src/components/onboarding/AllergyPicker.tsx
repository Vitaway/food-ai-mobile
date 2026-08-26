import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  ALLERGY_META,
  COMMON_ALLERGIES,
  type CommonAllergy,
} from '@/constants/profileOptions';

const NONE_ID = '__none__';

type AllergyPickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function AllergyPicker({ value, onChange }: AllergyPickerProps) {
  const noneSelected = value.length === 0;

  const selectNone = () => onChange([]);

  const toggle = (allergy: CommonAllergy) => {
    if (value.includes(allergy)) {
      onChange(value.filter((item) => item !== allergy));
      return;
    }
    onChange([...value, allergy]);
  };

  return (
    <View className="gap-3">
      <Pressable
        onPress={selectNone}
        className={`rounded-3xl border px-4 py-4 ${
          noneSelected
            ? 'border-blue-spruce-500 bg-blue-spruce-50'
            : 'border-ash-grey-200 bg-ash-grey-50'
        }`}>
        <Text className="text-center text-[28px] leading-9">✨</Text>
        <Text
          className={`mt-1 text-center text-sm font-sans-semibold ${
            noneSelected ? 'text-blue-spruce-800' : 'text-neutral-800'
          }`}>
          No allergies
        </Text>
        <Text
          className={`mt-0.5 text-center text-xs ${
            noneSelected ? 'text-blue-spruce-700' : 'text-neutral-500'
          }`}>
          Nothing to avoid
        </Text>
      </Pressable>

      <View className="flex-row flex-wrap gap-3">
        {COMMON_ALLERGIES.map((allergy) => {
          const selected = value.includes(allergy);
          const meta = ALLERGY_META[allergy];
          return (
            <Pressable
              key={allergy}
              onPress={() => toggle(allergy)}
              style={{ width: '47%' }}
              className={`rounded-3xl border px-3 py-3.5 ${
                selected
                  ? 'border-cinnamon-wood-400 bg-cinnamon-wood-50'
                  : 'border-ash-grey-200 bg-ash-grey-50'
              }`}>
              <Text className="text-center text-[28px] leading-9">{meta.emoji}</Text>
              <Text
                className={`mt-2 text-center text-sm font-sans-semibold ${
                  selected ? 'text-cinnamon-wood-800' : 'text-neutral-800'
                }`}>
                {allergy}
              </Text>
              <Text
                className={`mt-0.5 text-center text-xs ${
                  selected ? 'text-cinnamon-wood-700' : 'text-neutral-500'
                }`}>
                {meta.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { NONE_ID };
