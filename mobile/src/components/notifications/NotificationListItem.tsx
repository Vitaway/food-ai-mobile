import { Pressable, View } from 'react-native';

import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { AppNotification } from '@/hooks/useAppNotifications';

type NotificationListItemProps = {
  item: AppNotification & { timeLabel: string };
  onOpen: (item: AppNotification) => void | Promise<void>;
};

export function NotificationListItem({ item, onOpen }: NotificationListItemProps) {
  const handlePress = useSinglePress(() => {
    void onOpen(item);
  });

  return (
    <Pressable
      onPress={handlePress}
      className={`rounded-2xl border px-4 py-3.5 ${
        item.read
          ? 'border-ash-grey-100 bg-ash-grey-50'
          : 'border-cinnamon-wood-200 bg-cinnamon-wood-50'
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`font-sans-semibold ${item.read ? 'text-neutral-600' : 'text-neutral-900'}`}>
              {item.title}
            </Text>
            {!item.read ? (
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: semanticColors.accentOrange }} />
            ) : null}
            {item.kind === 'nudge' ? (
              <View className="rounded-full bg-cinnamon-wood-100 px-2 py-0.5">
                <Text className="text-[10px] font-sans-semibold uppercase text-cinnamon-wood-700">Nudge</Text>
              </View>
            ) : null}
            {item.kind === 'referral' ? (
              <View className="rounded-full bg-cinnamon-wood-100 px-2 py-0.5">
                <Text className="text-[10px] font-sans-semibold uppercase text-cinnamon-wood-700">Referral</Text>
              </View>
            ) : null}
          </View>
          <Text className={`mt-1 text-sm leading-5 ${item.read ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {item.message}
          </Text>
        </View>
        <View className="items-end gap-2">
          <Text className="text-xs text-neutral-400">{item.timeLabel}</Text>
          {item.status ? <MealStatusBadge status={item.status} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
