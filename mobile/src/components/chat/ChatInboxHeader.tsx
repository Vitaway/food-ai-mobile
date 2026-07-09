import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatTheme } from '@/components/chat/chatTheme';
import { Text } from '@/components/ui/Text';

type ChatInboxHeaderProps = {
  title?: string;
  onBack?: () => void;
};

export function ChatInboxHeader({ title = 'Chats', onBack }: ChatInboxHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: chatTheme.header,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 20,
      }}>
      <View className="flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10">
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </Pressable>
        ) : null}
        <Text className="font-sans-bold text-[22px] text-white">{title}</Text>
      </View>
    </View>
  );
}
