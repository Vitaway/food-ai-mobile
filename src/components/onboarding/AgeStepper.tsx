import { Minus, Plus } from 'iconoir-react-native';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import { ICONOIR_DEFAULTS } from '@/constants/onboardingIcons';

type AgeStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

function clampAge(raw: string, min: number, max: number) {
  const parsed = parseInt(raw.replace(/\D/g, ''), 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export function AgeStepper({ value, min = 13, max = 100, onChange }: AgeStepperProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commitDraft = (next: string) => {
    const clamped = clampAge(next, min, max);
    onChange(clamped);
    setDraft(String(clamped));
  };

  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <View className="rounded-3xl bg-ash-grey-50 px-5 py-4">
      <Text className="text-sm text-neutral-500">Your age</Text>

      <View className="mt-2 flex-row items-center justify-between">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={() => commitDraft(draft)}
          onSubmitEditing={() => commitDraft(draft)}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          selectTextOnFocus
          className="min-w-[80px] flex-1 font-sans-bold text-4xl text-neutral-900"
          placeholder={String(min)}
          placeholderTextColor="#848a75"
        />

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={decrement}
            disabled={value <= min}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
            style={{
              opacity: value <= min ? 0.4 : 1,
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <IconoirIcon icon={Minus} size={22} color={ICONOIR_DEFAULTS.color} />
          </Pressable>
          <Pressable
            onPress={increment}
            disabled={value >= max}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
            style={{
              opacity: value >= max ? 0.4 : 1,
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <IconoirIcon icon={Plus} size={22} color={ICONOIR_DEFAULTS.color} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
