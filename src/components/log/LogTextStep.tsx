import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type LogTextStepProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function LogTextStep({ value, onChangeText, onBack, onContinue }: LogTextStepProps) {
  const canContinue = value.trim().length >= 3;

  return (
    <View className="flex-1 bg-ash-grey-50">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="arrow-back" size={20} color="#4f5346" />
        </Pressable>
        <Text className="font-sans-semibold text-base text-neutral-800">Describe your meal</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-5 pt-4">
        <Text className="text-sm leading-5 text-neutral-500">
          List what you ate — separate items with commas for a better breakdown.
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="e.g. grilled chicken, brown rice, mixed salad"
          placeholderTextColor="#848a75"
          multiline
          textAlignVertical="top"
          className="mt-4 min-h-[160px] rounded-3xl bg-white px-4 py-4 text-base text-neutral-900"
        />
      </View>

      <View className="px-5 pb-6">
        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          className={`flex-row items-center justify-center gap-2 rounded-full py-4 ${
            canContinue ? 'bg-blue-spruce-950' : 'bg-ash-grey-300'
          }`}>
          <Text className="font-sans-semibold text-base text-white">Analyze meal</Text>
          <Ionicons name="sparkles-outline" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
