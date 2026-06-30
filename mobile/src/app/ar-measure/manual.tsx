import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { setPlateMeasureIntent } from '@/utils/plateMeasureIntent';

export default function ManualPlateMeasureRoute() {
  const router = useRouter();
  const [diameter, setDiameter] = useState('');

  const handleConfirm = () => {
    const value = Number.parseFloat(diameter.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || value > 60) {
      Alert.alert('Invalid size', 'Enter a plate diameter between 1 and 60 cm.');
      return;
    }

    setPlateMeasureIntent(Number(value.toFixed(1)));
    router.back();
  };

  return (
    <Screen>
      <ScreenTopBar title="Manual measure" onBack={() => router.back()} />
      <View className="px-5 pt-4">
        <Text className="font-sans-semibold text-xl text-neutral-900">Use a coin as reference</Text>
        <Text className="mt-2 text-sm leading-6 text-neutral-600">
          Place a standard coin on the table beside your plate. Measure the plate diameter with a ruler, or
          compare the plate width to the coin and enter the result in centimeters.
        </Text>

        <View className="mt-6">
          <Text className="mb-2 font-sans-medium text-sm text-neutral-700">Plate diameter (cm)</Text>
          <AppTextInput
            value={diameter}
            onChangeText={setDiameter}
            keyboardType="decimal-pad"
            placeholder="e.g. 26.0"
          />
        </View>

        <View className="mt-8">
          <Button label="Confirm size" variant="secondary" onPress={handleConfirm} />
        </View>
      </View>
    </Screen>
  );
}
