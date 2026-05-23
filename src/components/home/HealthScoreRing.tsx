import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type HealthScoreRingProps = {
  score: number;
  title?: string;
  subtitle?: string;
};

export function HealthScoreRing({
  score,
  title = 'Daily health score',
  subtitle = 'Well balanced today',
}: HealthScoreRingProps) {
  const progress = score / 100;

  return (
    <View className="mt-6 items-center">
      <View className="h-[200px] w-[200px] items-center justify-center">
        <View
          className="absolute h-[200px] w-[200px] rounded-full border-2 border-white/20"
          style={{ transform: [{ scale: 1.05 }] }}
        />
        <View
          className="absolute h-[180px] w-[180px] rounded-full border-[3px] border-white/30"
          style={{ opacity: 0.5 + progress * 0.5 }}
        />
        <View className="h-[160px] w-[160px] items-center justify-center rounded-full bg-white/15">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Ionicons name="leaf-outline" size={28} color="#ffffff" />
          </View>
          <Text className="mt-3 px-6 text-center text-sm text-white/90">{title}</Text>
          <Text className="font-sans-bold text-5xl text-white">{score}</Text>
          <Text className="mt-1 text-sm text-white/80">{subtitle}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        {[0, 1, 2].map((dot) => (
          <View key={dot} className={`h-1.5 rounded-full ${dot === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
        ))}
      </View>
    </View>
  );
}
