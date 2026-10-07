import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type LiveTargetsPreviewProps = {
  calories: number;
  proteinG: number;
  waterMl: number;
};

/** Compact live plan strip while editing goal / activity / metrics. */
export function LiveTargetsPreview({ calories, proteinG, waterMl }: LiveTargetsPreviewProps) {
  return (
    <View className="rounded-[22px] border border-blue-spruce-100 bg-blue-spruce-50 px-4 py-3.5">
      <Text className="text-[11px] font-sans-bold uppercase tracking-[0.1em] text-blue-spruce-500">
        Live targets
      </Text>
      <View className="mt-2 flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans-bold text-[28px] leading-8 text-blue-spruce-900">
            {Math.round(calories)}
          </Text>
          <Text className="text-[12px] text-blue-spruce-700">kcal / day</Text>
        </View>
        <View className="items-end">
          <Text className="font-sans-semibold text-[15px] text-blue-spruce-900">
            {Math.round(proteinG)} g protein
          </Text>
          <Text className="mt-0.5 text-[12px] text-blue-spruce-600">{Math.round(waterMl)} ml water</Text>
        </View>
      </View>
    </View>
  );
}
