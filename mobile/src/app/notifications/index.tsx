import { useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { useAppNotifications, type AppNotification } from '@/hooks/useAppNotifications';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';

export default function NotificationsScreen() {
  const { t } = useI18n();
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
      if (item.kind === 'review' && item.mealId) {
        push(`/coach/meal/${item.mealId}` as Href);
        return;
      }
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
      <ScreenTopBar title={t.notifications.title} onBack={back} />

      <StackScreenBody>
        <View className="mx-5 mb-3 mt-2">
          <FreePlanBanner compact />
        </View>

        {unread.length > 0 ? (
          <Pressable onPress={markAllReadOnce} className="mx-5 mb-2 self-end">
            <Text className="font-sans-semibold text-sm text-cinnamon-wood-400">
              {t.notifications.markAllRead}
            </Text>
          </Pressable>
        ) : null}

        <ScrollView contentContainerClassName="gap-3 px-5 pb-10 pt-2">
          {items.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-5 py-10">
              <Text className="text-center font-sans-semibold text-neutral-700">
                {t.notifications.emptyTitle}
              </Text>
              <Text className="mt-2 text-center text-sm text-neutral-500">
                {t.notifications.emptyBody}
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
