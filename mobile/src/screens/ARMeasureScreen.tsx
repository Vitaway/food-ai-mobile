import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ARMeasureOverlay } from '@/components/ARMeasureOverlay';
import { ARMeasureScene } from '@/components/ar/ARMeasureScene';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ARMeasureSessionProvider, useARMeasureSession } from '@/context/ARMeasureSessionContext';
import {
  canUseAR,
  checkARSupport,
  getInitialARSupportState,
  loadViroARSceneNavigator,
} from '@/utils/arAvailability';
import { isValidPlateDiameterCm } from '@/utils/arMeasure';

export type ARMeasureScreenProps = {
  onMeasurementConfirmed: (diameterCm: number) => void;
  onOpenManualFallback?: () => void;
  onCancel?: () => void;
};

function ARMeasureExperience({
  onMeasurementConfirmed,
  onCancel,
  onOpenManualFallback,
}: Pick<ARMeasureScreenProps, 'onMeasurementConfirmed' | 'onCancel' | 'onOpenManualFallback'>) {
  const {
    step,
    diameterCm,
    planeDetected,
    tapHint,
    resetMeasurement,
  } = useARMeasureSession();

  const ViroARSceneNavigator = loadViroARSceneNavigator();

  const handleConfirm = useCallback(() => {
    if (diameterCm == null || !isValidPlateDiameterCm(diameterCm)) return;
    onMeasurementConfirmed(diameterCm);
  }, [diameterCm, onMeasurementConfirmed]);

  if (!ViroARSceneNavigator) {
    return (
      <ARUnsupportedFallback
        message="AR could not start on this device."
        onOpenManualFallback={onOpenManualFallback}
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: () => <ARMeasureScene /> }}
        style={{ flex: 1 }}
      />
      <ARMeasureOverlay
        step={step}
        planeDetected={planeDetected}
        diameterCm={diameterCm}
        tapHint={tapHint}
        onRetake={resetMeasurement}
        onConfirm={handleConfirm}
        onClose={onCancel}
        onUseManual={onOpenManualFallback}
      />
    </View>
  );
}

function ARUnsupportedFallback({
  message = 'AR is not supported on this device. Please use a coin as a reference object instead.',
  onOpenManualFallback,
}: Pick<ARMeasureScreenProps, 'onOpenManualFallback'> & { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-neutral-100 px-6">
      <Text className="text-center font-sans-semibold text-2xl text-neutral-900">AR not available</Text>
      <Text className="mt-3 text-center text-base text-neutral-600">{message}</Text>
      {onOpenManualFallback ? (
        <View className="mt-8 w-full">
          <Button label="Manual measurement" variant="secondary" onPress={onOpenManualFallback} />
        </View>
      ) : null}
    </View>
  );
}

export function ARMeasureScreen({
  onMeasurementConfirmed,
  onOpenManualFallback,
  onCancel,
}: ARMeasureScreenProps) {
  const [arSupported, setArSupported] = useState<boolean | null>(getInitialARSupportState);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (arSupported !== null) return;

    let cancelled = false;

    async function detectSupport() {
      const supported = await checkARSupport();
      if (cancelled) return;

      if (!supported) {
        setInitError('Could not start AR on this device.');
      }
      setArSupported(supported);
    }

    detectSupport();
    return () => {
      cancelled = true;
    };
  }, [arSupported]);

  if (!canUseAR()) {
    return <ARUnsupportedFallback onOpenManualFallback={onOpenManualFallback} />;
  }

  if (arSupported === null) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100">
        <ActivityIndicator size="large" color="#168376" />
        <Text className="mt-4 text-sm text-neutral-600">Checking AR support…</Text>
      </View>
    );
  }

  if (!arSupported) {
    return (
      <View className="flex-1 bg-neutral-100">
        {initError ? (
          <Text className="px-6 pt-16 text-center text-sm text-neutral-500">{initError}</Text>
        ) : null}
        <ARUnsupportedFallback onOpenManualFallback={onOpenManualFallback} />
      </View>
    );
  }

  return (
    <ARMeasureSessionProvider>
      <ARMeasureExperience
        onMeasurementConfirmed={onMeasurementConfirmed}
        onCancel={onCancel}
        onOpenManualFallback={onOpenManualFallback}
      />
    </ARMeasureSessionProvider>
  );
}
