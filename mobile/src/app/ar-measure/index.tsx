import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ARMeasureScreen } from '@/screens/ARMeasureScreen';
import { canUseAR } from '@/utils/arAvailability';
import { isValidPlateDiameterCm, MAX_PLATE_DIAMETER_CM, MIN_PLATE_DIAMETER_CM } from '@/utils/arMeasure';
import { setPlateMeasureIntent } from '@/utils/plateMeasureIntent';

export default function ARMeasureRoute() {
  const router = useRouter();

  const openManualFallback = useCallback(() => {
    router.replace('/ar-measure/manual' as Href);
  }, [router]);

  useEffect(() => {
    if (!canUseAR()) {
      router.replace('/ar-measure/manual' as Href);
    }
  }, [router]);

  if (!canUseAR()) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100">
        <ActivityIndicator size="large" color="#168376" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ARMeasureScreen
        onCancel={() => router.back()}
        onMeasurementConfirmed={(diameterCm) => {
          if (!isValidPlateDiameterCm(diameterCm)) {
            Alert.alert(
              'Invalid measurement',
              `Plate diameter should be between ${MIN_PLATE_DIAMETER_CM} and ${MAX_PLATE_DIAMETER_CM} cm. Try again or use manual measurement.`,
            );
            return;
          }
          setPlateMeasureIntent(diameterCm);
          router.back();
        }}
        onOpenManualFallback={openManualFallback}
      />
    </View>
  );
}
