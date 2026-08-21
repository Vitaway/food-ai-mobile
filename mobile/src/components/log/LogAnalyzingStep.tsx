import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';

type LogAnalyzingStepProps = {
  variant?: 'photo' | 'text' | 'title';
};

export function LogAnalyzingStep({ variant = 'photo' }: LogAnalyzingStepProps) {
  if (variant === 'title') {
    return (
      <View className="py-4">
        <LogCard className="items-center py-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-shamrock-100">
            <ActivityIndicator size="large" color="#1D9E75" />
          </View>
          <Text className="mt-6 font-sans-bold text-xl text-neutral-900">Naming your meal</Text>
          <Text className="mt-2 px-4 text-center text-sm leading-5 text-neutral-500">
            AI is writing a short dish title for your food log. Your coach will confirm nutrition next.
          </Text>
        </LogCard>
      </View>
    );
  }

  return (
    <View className="py-4">
      <LogCard className="items-center py-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-shamrock-100">
          <Ionicons name="sparkles" size={36} color="#1D9E75" />
        </View>
        <Text className="mt-6 font-sans-bold text-xl text-neutral-900">Analyzing your meal</Text>
        <Text className="mt-2 px-4 text-center text-sm leading-5 text-neutral-500">
          {variant === 'photo'
            ? 'AI is identifying food and estimating nutrition from your photo.'
            : 'AI is estimating ingredients and nutrition from your description.'}
        </Text>
      </LogCard>

      <LogCard className="mt-4">
        <Text className="mb-4 font-sans-semibold text-base text-neutral-900">Progress</Text>
        <View className="flex-row gap-3">
          <ActivityIndicator size="small" color="#1D9E75" />
          <View className="flex-1">
            <Text className="font-sans-semibold text-sm text-shamrock-700">
              Identify food & calculate
            </Text>
            <Text className="mt-0.5 text-sm leading-5 text-neutral-500">
              Reading ingredients and estimating macros…
            </Text>
          </View>
        </View>
      </LogCard>
    </View>
  );
}
