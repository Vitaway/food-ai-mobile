import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { formatCups, formatCupsLabel } from '@/utils/waterUnits';

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

type WaterCustomStepperProps = {
  cups: number;
  logging: boolean;
  onChange: (cups: number) => void;
  onSubmit: () => void;
};

function clampCups(value: number) {
  return Math.min(20, Math.max(0.25, Math.round(value * 4) / 4));
}

export function WaterCustomStepper({ cups, logging, onChange, onSubmit }: WaterCustomStepperProps) {
  const step = (delta: number) => onChange(clampCups(cups + delta));

  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Custom amount</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Fine-tune in ¼-cup steps</Text>

      <View className="mt-5 flex-row items-center justify-center gap-5">
        <Pressable
          disabled={logging || cups <= 0.25}
          onPress={() => step(-0.25)}
          className={`h-12 w-12 items-center justify-center rounded-full border ${
            logging || cups <= 0.25
              ? 'border-ash-grey-100 bg-ash-grey-50 opacity-50'
              : 'border-ash-grey-200 bg-white active:opacity-80'
          }`}>
          <Ionicons name="remove" size={22} color={semanticColors.primary} />
        </Pressable>

        <View className="min-w-[120px] items-center">
          <Text className="font-sans-bold text-4xl text-blue-spruce-900">{formatCups(cups)}</Text>
          <Text className="mt-1 text-sm text-neutral-500">{cups === 1 ? 'cup' : 'cups'}</Text>
        </View>

        <Pressable
          disabled={logging || cups >= 20}
          onPress={() => step(0.25)}
          className={`h-12 w-12 items-center justify-center rounded-full border ${
            logging || cups >= 20
              ? 'border-ash-grey-100 bg-ash-grey-50 opacity-50'
              : 'border-cinnamon-wood-100 bg-cinnamon-wood-50 active:opacity-80'
          }`}>
          <Ionicons name="add" size={22} color={semanticColors.accentOrange} />
        </Pressable>
      </View>

      <View className="mt-5">
        <Button
          label={logging ? 'Logging…' : `Add ${formatCupsLabel(cups)}`}
          onPress={onSubmit}
          disabled={logging}
          fullWidth
          variant="secondary"
        />
      </View>
    </View>
  );
}
