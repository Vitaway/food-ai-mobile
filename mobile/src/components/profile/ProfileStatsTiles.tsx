import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Stat = {
  label: string;
  value: string;
};

type ProfileStatsTilesProps = {
  stats: Stat[];
};

export function ProfileStatsTiles({ stats }: ProfileStatsTilesProps) {
  return (
    <View className="mb-4 flex-row gap-2.5">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="min-w-0 flex-1 rounded-2xl border border-ash-grey-100 bg-white px-3 py-3.5"
          style={{
            shadowColor: '#1a3a2a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 1,
          }}>
          <Text className="text-[10px] font-sans-bold uppercase tracking-[0.1em] text-ash-grey-400">
            {stat.label}
          </Text>
          <Text className="mt-1.5 font-sans-bold text-[18px] text-blue-spruce-900" numberOfLines={1}>
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
