import { Minus, Plus } from 'iconoir-react-native';
import { Pressable, View } from 'react-native';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
import { Text } from '@/components/ui/Text';
import { ICONOIR_DEFAULTS } from '@/constants/onboardingIcons';
import { formatHour12, formatQuietHoursRange } from '@/utils/formatHour';

type HourStepperProps = {
  label: string;
  value: number;
  onChange: (hour: number) => void;
};

function HourStepper({ label, value, onChange }: HourStepperProps) {
  const decrement = () => onChange(value <= 0 ? 23 : value - 1);
  const increment = () => onChange(value >= 23 ? 0 : value + 1);

  return (
    <View className="flex-1 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-3 py-3">
      <Text className="text-xs font-sans-medium text-neutral-500">{label}</Text>
      <Text className="mt-1 font-sans-bold text-lg text-neutral-900">{formatHour12(value)}</Text>
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <Pressable
          onPress={decrement}
          className="h-10 w-10 items-center justify-center rounded-xl bg-white"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}>
          <IconoirIcon icon={Minus} size={20} color={ICONOIR_DEFAULTS.color} />
        </Pressable>
        <Pressable
          onPress={increment}
          className="h-10 w-10 items-center justify-center rounded-xl bg-white"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}>
          <IconoirIcon icon={Plus} size={20} color={ICONOIR_DEFAULTS.color} />
        </Pressable>
      </View>
    </View>
  );
}

type QuietHoursPickerProps = {
  start: number;
  end: number;
  onChangeStart: (hour: number) => void;
  onChangeEnd: (hour: number) => void;
};

export function QuietHoursPicker({ start, end, onChangeStart, onChangeEnd }: QuietHoursPickerProps) {
  const overnight = start !== end && start > end;

  return (
    <View className="gap-3 rounded-2xl border border-blue-spruce-100 bg-blue-spruce-50/40 p-4">
      <View>
        <Text className="font-sans-semibold text-base text-neutral-900">Quiet hours</Text>
        <Text className="mt-1 text-sm text-neutral-600">
          No meal, hydration, or streak nudges during this window.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <HourStepper label="Starts" value={start} onChange={onChangeStart} />
        <HourStepper label="Ends" value={end} onChange={onChangeEnd} />
      </View>

      <Text className="text-sm text-blue-spruce-800">
        {formatQuietHoursRange(start, end)}
        {overnight ? ' · spans midnight' : ''}
      </Text>
    </View>
  );
}
