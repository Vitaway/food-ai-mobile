import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';

export function LogAnalyzingStep() {
  return (
    <View className="flex-1 justify-center py-8">
      <LogCard className="items-center py-10">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-shamrock-100">
          <Ionicons name="sparkles" size={36} color="#1D9E75" />
        </View>
        <Text className="mt-6 font-sans-bold text-xl text-neutral-900">Analyzing your meal</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-neutral-500">
          Estimating ingredients, portions, and nutrition…
        </Text>
        <ActivityIndicator color="#1D9E75" style={{ marginTop: 28 }} />
      </LogCard>
    </View>
  );
}
