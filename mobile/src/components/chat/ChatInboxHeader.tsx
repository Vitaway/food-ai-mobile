import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatTheme } from '@/components/chat/chatTheme';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';

type ChatInboxHeaderProps = {
  title?: string;
  onBack?: () => void;
};

export function ChatInboxHeader({ title, onBack }: ChatInboxHeaderProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const heading = title ?? t.chat.inboxTitle;

  return (
    <View
      className="overflow-hidden rounded-b-[28px]"
      style={{
        backgroundColor: chatTheme.header,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderCurve: 'continuous',
      }}>
      <View className="flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.goBack}
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10">
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </Pressable>
        ) : null}
        <Text className="font-sans-bold text-[22px] text-white">{heading}</Text>
      </View>
    </View>
  );
}
