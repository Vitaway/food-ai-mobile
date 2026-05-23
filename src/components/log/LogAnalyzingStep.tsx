import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { MOCK_MEAL_IMAGE, MOCK_SCAN_RESULT } from '@/constants/logMock';

type LogAnalyzingStepProps = {
  bottomPadding: number;
};

export function LogAnalyzingStep({ bottomPadding }: LogAnalyzingStepProps) {
  return (
    <View className="flex-1 items-center justify-center bg-ash-grey-50 px-8" style={{ paddingBottom: bottomPadding }}>
      <View className="h-24 w-24 items-center justify-center rounded-full bg-shamrock-100">
        <Ionicons name="sparkles" size={40} color="#408c5c" />
      </View>
      <Text className="mt-6 font-sans-bold text-2xl text-neutral-900">Analyzing your meal</Text>
      <Text className="mt-2 text-center text-base leading-6 text-neutral-500">
        AI is detecting ingredients, estimating portions, and calculating nutrition…
      </Text>
      <ActivityIndicator color="#1eae9e" style={{ marginTop: 32 }} />
      <Text className="mt-4 text-sm text-neutral-400">{MOCK_SCAN_RESULT.name}</Text>
    </View>
  );
}
