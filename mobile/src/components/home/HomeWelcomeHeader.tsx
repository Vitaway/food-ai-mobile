import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type HomeWelcomeHeaderProps = {
  firstName: string;
  avatarUrl?: string;
  notificationCount?: number;
  onPressNotifications: () => void;
  onPressProfile: () => void;
};

export function HomeWelcomeHeader({
  firstName,
  avatarUrl,
  notificationCount = 0,
  onPressNotifications,
  onPressProfile,
}: HomeWelcomeHeaderProps) {
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <Pressable onPress={onPressProfile} className="flex-row items-center gap-3 active:opacity-90">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="h-12 w-12 rounded-full" resizeMode="cover" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-spruce-100">
            <Text className="font-sans-bold text-lg text-blue-spruce-700">{firstName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View>
          <Text className="text-sm text-neutral-500">Welcome back 👋</Text>
          <Text className="font-sans-bold text-xl text-neutral-900">{firstName}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onPressNotifications}
        className="relative h-11 w-11 items-center justify-center rounded-full bg-white"
        style={{
          shadowColor: '#1a1c17',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}>
        <Ionicons name="notifications-outline" size={22} color="#023459" />
        {notificationCount > 0 ? (
          <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cinnamon-wood-500" />
        ) : null}
      </Pressable>
    </View>
  );
}
