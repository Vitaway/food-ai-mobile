import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useAppNotifications, type AppNotification } from '@/hooks/useAppNotifications';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';

export default function NotificationsScreen() {
  const { push, back } = useNavigateOnce();
  const { items, markRead, markAllRead, refreshContext } = useAppNotifications();

  useFocusEffect(
    useCallback(() => {
      void refreshContext({ includeServer: true });
    }, [refreshContext]),
  );

  const unread = items.filter((item) => !item.read);
  const markAllReadOnce = useSinglePress(markAllRead);

  const openItem = useCallback(
    async (item: AppNotification) => {
      await markRead(item.readKey);
      if (item.mealId) {
        push(`/meal/${item.mealId}`);
        return;
      }
      if (item.kind === 'referral') {
        push('/referral');
      }
    },
    [markRead, push],
  );

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Notifications" onBack={back} />

      <StackScreenBody>
        {unread.length > 0 ? (
          <Pressable onPress={markAllReadOnce} className="mx-5 mb-2 self-end">
            <Text className="font-sans-semibold text-sm text-cinnamon-wood-400">Mark all read</Text>
          </Pressable>
        ) : null}

        <ScrollView contentContainerClassName="gap-3 px-5 pb-10 pt-2">
          {items.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-5 py-10">
              <Text className="text-center font-sans-semibold text-neutral-700">All caught up</Text>
              <Text className="mt-2 text-center text-sm text-neutral-500">
                Meal updates, referrals, and local nudges will show up here in real time.
              </Text>
            </View>
          ) : (
            items.map((item) => <NotificationListItem key={item.id} item={item} onOpen={openItem} />)
          )}
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
