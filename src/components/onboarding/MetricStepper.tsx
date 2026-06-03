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
    <View
      className="rounded-3xl border border-ash-grey-100 bg-white px-5 py-4"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      }}>
      <Text className="text-sm text-neutral-500">{label}</Text>

      <View className="mt-2 flex-row items-center justify-between">
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
            className="min-w-[80px] shrink"
            placeholder={String(min)}
          />
          {unit ? <Text className="font-sans-medium text-base text-neutral-500">{unit}</Text> : null}
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={decrement}
            disabled={value <= min}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-shamrock-50"
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
            className="h-12 w-12 items-center justify-center rounded-2xl bg-shamrock-50"
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

export function AgeStepper(props: Omit<MetricStepperProps, 'label' | 'decimals' | 'min' | 'max' | 'step' | 'maxLength'>) {
  return (
    <MetricStepper
      label="Your age"
      min={13}
      max={100}
      step={1}
      decimals={0}
      maxLength={3}
      {...props}
    />
  );
}
