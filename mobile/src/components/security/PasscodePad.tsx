import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

type PasscodePadProps = {
  value: string;
  length?: number;
  onChange: (value: string) => void;
};

export function PasscodePad({ value, length = 4, onChange }: PasscodePadProps) {
  const handleKey = (key: (typeof KEYS)[number]) => {
    if (key === '') return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    onChange(`${value}${key}`);
  };

  return (
    <View className="gap-6">
      <View className="flex-row justify-center gap-3">
        {Array.from({ length }).map((_, index) => (
          <View
            key={index}
            className={`h-3 w-3 rounded-full ${index < value.length ? 'bg-blue-spruce-600' : 'bg-ash-grey-200'}`}
          />
        ))}
      </View>

      <View className="flex-row flex-wrap justify-center gap-3 px-4">
        {KEYS.map((key, index) => {
          if (key === '') {
            return <View key={`spacer-${index}`} className="h-16 w-[28%]" />;
          }

          return (
            <Pressable
              key={`${key}-${index}`}
              onPress={() => handleKey(key)}
              className="h-16 w-[28%] items-center justify-center rounded-2xl bg-ash-grey-50 active:bg-ash-grey-100">
              <Text className="font-sans-semibold text-2xl text-neutral-900">
                {key === 'del' ? '⌫' : key}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
