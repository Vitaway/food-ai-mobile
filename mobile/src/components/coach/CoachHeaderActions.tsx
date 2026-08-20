import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';
import { useSinglePress } from '@/hooks/useSinglePress';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1">
      <Text className="text-[10px] font-sans-bold text-white">{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

type CoachHeaderActionsProps = {
  /** When true, icons sit on the brand header (light circles). */
  onDark?: boolean;
};

export function CoachHeaderActions({ onDark = true }: CoachHeaderActionsProps) {
  const router = useRouter();
  const notificationUnread = useNotificationUnreadCount();
  const chatUnread = useChatUnreadCount();

  const openNotifications = useSinglePress(() => router.push('/notifications' as Href));
  const openChat = useSinglePress(() => router.push('/(coach)/chat' as Href));

  const circleClass = onDark ? 'bg-white/20' : 'bg-ash-grey-100';
  const iconColor = onDark ? '#ffffff' : '#023459';

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={openChat}
        accessibilityRole="button"
        accessibilityLabel="Messages"
        className={`relative h-11 w-11 items-center justify-center rounded-full ${circleClass}`}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={iconColor} />
        <Badge count={chatUnread} />
      </Pressable>
      <Pressable
        onPress={openNotifications}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        className={`relative h-11 w-11 items-center justify-center rounded-full ${circleClass}`}>
        <Ionicons name="notifications-outline" size={20} color={iconColor} />
        <Badge count={notificationUnread} />
      </Pressable>
    </View>
  );
}
