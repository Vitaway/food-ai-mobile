import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { chatTheme } from '@/components/chat/chatTheme';

export function ChatDateDivider({ label }: { label: string }) {
  return (
    <View className="items-center py-3">
      <View
        className="rounded-lg px-3 py-1"
        style={{
          backgroundColor: chatTheme.datePill,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 2,
          elevation: 1,
        }}>
        <Text className="text-xs font-sans-semibold" style={{ color: chatTheme.datePillText }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
