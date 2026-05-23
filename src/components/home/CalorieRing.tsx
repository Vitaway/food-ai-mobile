import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

type CalorieRingProps = {
  consumed: number;
  target: number;
};

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const remaining = Math.max(target - consumed, 0);

  return (
    <View className="items-center rounded-3xl bg-white p-6 shadow-sm">
      <View className="h-36 w-36 items-center justify-center rounded-full border-[10px] border-blue-spruce-200 bg-blue-spruce-50">
        <View
          className="absolute inset-2 rounded-full border-[10px] border-blue-spruce-500"
          style={{ opacity: 0.15 + progress * 0.85 }}
        />
        <Text className="font-sans-bold text-3xl text-neutral-900">{consumed}</Text>
        <Text className="text-sm text-neutral-500">/ {target} kcal</Text>
      </View>
      <Text className="mt-4 font-sans-semibold text-neutral-800">{remaining} kcal remaining</Text>
    </View>
  );
}
