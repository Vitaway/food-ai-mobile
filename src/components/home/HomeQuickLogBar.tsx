import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';

type HomeQuickLogBarProps = {
  onPress: () => void;
};

export function HomeQuickLogBar({ onPress }: HomeQuickLogBarProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 flex-row items-center gap-3 rounded-full bg-white px-5 py-4 active:opacity-95"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}>
      <Ionicons name="search-outline" size={22} color="#848a75" />
      <Text className="flex-1 font-sans-medium text-base text-neutral-400">Log a meal or check your day…</Text>
    </Pressable>
  );
}
