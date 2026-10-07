import { Minus, Plus } from 'iconoir-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import { ICONOIR_DEFAULTS } from '@/constants/onboardingIcons';

type MetricStepperProps = {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  maxLength?: number;
  onChange: (value: number) => void;
};

function sanitizeDraft(raw: string, decimals: number) {
  if (decimals === 0) return raw.replace(/\D/g, '');

  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

function clampValue(raw: string, min: number, max: number, decimals: number) {
  const parsed = decimals === 0 ? parseInt(raw.replace(/\D/g, ''), 10) : parseFloat(raw);
  if (Number.isNaN(parsed)) return min;

  const factor = 10 ** decimals;
  const rounded = Math.round(parsed * factor) / factor;
  return Math.min(max, Math.max(min, rounded));
}

function formatValue(value: number, decimals: number) {
  return decimals === 0 ? String(value) : value.toFixed(decimals).replace(/\.0$/, '');
}

export function MetricStepper({
  label,
  value,
  unit,
  min = 0,
  max = 999,
  step = 1,
  decimals = 0,
  maxLength,
  onChange,
}: MetricStepperProps) {
  const [draft, setDraft] = useState(formatValue(value, decimals));

  useEffect(() => {
    setDraft(formatValue(value, decimals));
  }, [value, decimals]);

  const commitDraft = (next: string) => {
    const clamped = clampValue(next, min, max, decimals);
    onChange(clamped);
    setDraft(formatValue(clamped, decimals));
  };

  const decrement = () => {
    const next = Math.max(min, Math.round((value - step) * 10 ** decimals) / 10 ** decimals);
    onChange(next);
  };

  const increment = () => {
    const next = Math.min(max, Math.round((value + step) * 10 ** decimals) / 10 ** decimals);
    onChange(next);
  };

  return (
    <View className="border-b-0">
      <Text className="mb-1.5 text-sm font-sans-semibold text-blue-spruce-800">{label}</Text>

      <View className="min-h-[56px] flex-row items-center justify-between rounded-2xl border-2 border-blue-spruce-500/25 bg-white/92 px-4 py-2">
        <View className="flex-1 flex-row items-baseline gap-1">
          <AppTextInput
            value={draft}
            onChangeText={(text) => setDraft(sanitizeDraft(text, decimals))}
            onBlur={() => commitDraft(draft)}
            onSubmitEditing={() => commitDraft(draft)}
            keyboardType={decimals === 0 ? 'number-pad' : 'decimal-pad'}
            returnKeyType="done"
            maxLength={maxLength}
            selectTextOnFocus
            size="display"
            weight="bold"
            className="min-w-[80px] shrink bg-transparent px-0 text-blue-spruce-900"
            placeholder={String(min)}
            placeholderTextColor="#6b7a52"
          />
          {unit ? <Text className="font-sans-medium text-base text-blue-spruce-600/70">{unit}</Text> : null}
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={decrement}
            disabled={value <= min}
            className="h-11 w-11 items-center justify-center rounded-xl border border-blue-spruce-300/80 bg-blue-spruce-600/5"
            style={{ opacity: value <= min ? 0.4 : 1 }}>
            <IconoirIcon icon={Minus} size={20} color={ICONOIR_DEFAULTS.color} />
          </Pressable>
          <Pressable
            onPress={increment}
            disabled={value >= max}
            className="h-11 w-11 items-center justify-center rounded-xl bg-blue-spruce-600"
            style={{ opacity: value >= max ? 0.4 : 1 }}>
            <IconoirIcon icon={Plus} size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
