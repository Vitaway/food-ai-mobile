import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { chatTheme } from '@/components/chat/chatTheme';
import { Text } from '@/components/ui/Text';

type ChatThreadHeaderProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  onBack: () => void;
};

export function ChatThreadHeader({
  title,
  subtitle = 'MiraFood coach',
  imageUrl,
  onBack,
}: ChatThreadHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: chatTheme.header,
        paddingTop: insets.top + 4,
        paddingBottom: 10,
        paddingHorizontal: 8,
      }}>
      <View className="flex-row items-center gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-white/10">
          <Ionicons name="chevron-back" size={26} color="#ffffff" />
        </Pressable>

        <View className="mr-2">
          <ChatAvatar name={title} imageUrl={imageUrl} size="lg" />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="font-sans-semibold text-[17px] text-white" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-[13px]" style={{ color: chatTheme.headerSubtext }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}
