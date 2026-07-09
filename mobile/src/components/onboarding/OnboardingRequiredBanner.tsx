import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';

export function OnboardingRequiredBanner() {
  return (
    <View className="mb-4 flex-row items-start gap-3 rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-3">
      <Ionicons name="information-circle" size={22} color={palette['cinnamon-wood'][600]} />
      <View className="flex-1">
        <Text className="font-sans-semibold text-sm text-cinnamon-wood-900">
          Complete your health profile to unlock MiraFood
        </Text>
        <Text className="mt-1 text-xs leading-5 text-cinnamon-wood-800">
          Finish setup below before you can log meals or use the rest of the app.
        </Text>
      </View>
    </View>
  );
}
