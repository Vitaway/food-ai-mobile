import { useProfileBack } from '@/hooks/useProfileBack';
import { ScrollView, View } from 'react-native';

import { NotificationSettingsPanel } from '@/components/notifications/NotificationSettingsPanel';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';

export default function NotificationSettingsScreen() {
  const handleBack = useProfileBack();

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Notification settings" onBack={handleBack} />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-4 pt-4">
          <Text className="text-sm leading-5 text-neutral-500">
            Set when nudges are paused and which reminders you want. Meal pipeline updates always appear in
            your notification list.
          </Text>
          <NotificationSettingsPanel />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
