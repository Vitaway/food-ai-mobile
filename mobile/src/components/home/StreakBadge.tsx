import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type StreakBadgeProps = {
  days: number;
};

export function StreakBadge({ days }: StreakBadgeProps) {
  const active = days > 0;

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
        active ? 'bg-cinnamon-wood-100' : 'bg-ash-grey-100'
      }`}>
      <Ionicons name="flame" size={16} color={active ? '#FF6F32' : '#848a75'} />
      <Text
        className={`font-sans-semibold text-sm ${active ? 'text-cinnamon-wood-700' : 'text-neutral-500'}`}>
        {days > 0 ? `${days} day streak` : 'Start your streak'}
      </Text>
    </View>
  );
}
