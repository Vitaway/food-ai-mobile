import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MeasureStep } from '@/utils/arMeasure';
import { formatDiameterCm } from '@/utils/formatDiameter';

type ARMeasureOverlayProps = {
  step: MeasureStep;
  planeDetected: boolean;
  diameterCm: number | null;
  tapHint: string | null;
  onRetake: () => void;
  onConfirm: () => void;
  onClose?: () => void;
  onUseManual?: () => void;
};

function stepLabel(step: MeasureStep, planeDetected: boolean): string {
  if (!planeDetected || step === 'scanning') return 'Scanning surface…';
  if (step === 'tapFirst') return 'Tap the LEFT edge of your plate';
  if (step === 'tapSecond') return 'Tap the RIGHT edge of your plate';
  return 'Measurement ready';
}

function stepIndicator(step: MeasureStep, planeDetected: boolean): string {
  if (!planeDetected || step === 'scanning') return 'Finding table surface';
  if (step === 'tapFirst') return 'Step 1 of 2';
  if (step === 'tapSecond') return 'Step 2 of 2';
  return 'Done';
}

export function ARMeasureOverlay({
  step,
  planeDetected,
  diameterCm,
  tapHint,
  onRetake,
  onConfirm,
  onClose,
  onUseManual,
}: ARMeasureOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-0 justify-between"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
      {onClose ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close AR measurement"
          onPress={onClose}
          className="absolute right-5 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/50"
          style={{ top: insets.top + 8 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </Pressable>
      ) : null}
      <View pointerEvents="none" className="mx-5 rounded-2xl bg-black/55 px-4 py-3">
        <Text className="font-sans-semibold text-sm text-white/70">{stepIndicator(step, planeDetected)}</Text>
        <Text className="mt-1 font-sans-semibold text-lg text-white">{stepLabel(step, planeDetected)}</Text>
        {tapHint ? <Text className="mt-2 text-sm text-cinnamon-wood-300">{tapHint}</Text> : null}
      </View>

      {step === 'confirmed' && diameterCm != null ? (
        <View className="mx-5 rounded-3xl bg-white px-5 py-5 shadow-lg">
          <Text className="text-center font-sans-semibold text-xl text-neutral-900">
            Plate diameter: {formatDiameterCm(diameterCm)}
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-500">
            Use this size to improve portion estimates when you log meals.
          </Text>
          <View className="mt-4 gap-3">
            <Button label="Confirm" variant="secondary" onPress={onConfirm} />
            <Button label="Retake" variant="outline" onPress={onRetake} />
          </View>
        </View>
      ) : (
        <View className="mx-5 gap-3">
          <View pointerEvents="none" className="rounded-2xl bg-black/45 px-4 py-3">
            <Text className="text-center text-sm text-white">
              Hold your phone above the plate and move slowly until the table surface is detected.
            </Text>
          </View>
          {onUseManual ? (
            <Button label="Use manual measurement" variant="outline" onPress={onUseManual} />
          ) : null}
        </View>
      )}
    </View>
  );
}
