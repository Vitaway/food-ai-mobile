import { ScrollView, View } from 'react-native';

import { NotificationSettingsPanel } from '@/components/notifications/NotificationSettingsPanel';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useCoachProfileBack } from '@/hooks/useCoachProfileBack';

export default function CoachNotificationSettingsScreen() {
  const handleBack = useCoachProfileBack();

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Notification settings" onBack={handleBack} />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <Text className="text-sm leading-5 text-neutral-500">
            Control push alerts for new meal reviews, patient messages, and queue updates on this device.
          </Text>
          <NotificationSettingsPanel />
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
