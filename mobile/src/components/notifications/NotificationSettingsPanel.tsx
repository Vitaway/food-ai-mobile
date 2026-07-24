import { useCallback, useEffect, useState } from 'react';
import { Linking, Switch, View } from 'react-native';

import { QuietHoursPicker } from '@/components/notifications/QuietHoursPicker';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { services } from '@/services';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationCategory,
  type NotificationSettings,
} from '@/services/local/notificationPreferences';
import {
  requestPushPermissions,
  syncPushTokenWithServer,
} from '@/services/push/pushNotifications';

const CATEGORY_LABELS: Record<NotificationCategory, { title: string; description: string }> = {
  meals: { title: 'Meal reminders', description: 'Missed breakfast, lunch, or dinner windows' },
  hydration: { title: 'Hydration', description: "Midday water check when you're behind" },
  streak: { title: 'Streak', description: 'Evening reminder if today has no logs' },
};

type NotificationSettingsPanelProps = {
  onSettingsChange?: (settings: NotificationSettings) => void;
};

export function NotificationSettingsPanel({ onSettingsChange }: NotificationSettingsPanelProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    services.notificationsRepository.getSettings().then((value) => {
      setSettings(value);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(
    async (next: NotificationSettings) => {
      setSettings(next);
      await services.notificationsRepository.saveSettings(next);
      onSettingsChange?.(next);
    },
    [onSettingsChange],
  );

  async function enablePush() {
    setPushBusy(true);
    setPushMessage(null);
    try {
      const granted = await requestPushPermissions();
      if (!granted) {
        setPushMessage('Notifications are off. Enable them in phone Settings.');
        return;
      }
      await syncPushTokenWithServer();
      setPushMessage('Phone notifications are enabled for this device.');
    } catch {
      setPushMessage('Could not enable notifications right now.');
    } finally {
      setPushBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <View className="gap-5">
      <View className="gap-3 rounded-2xl border border-ash-grey-100 bg-white p-4 shadow-sm">
        <Text className="font-sans-semibold text-base text-neutral-900">Phone alerts</Text>
        <Text className="-mt-1 text-sm text-neutral-500">
          Allow MiraFood to send lock-screen alerts for meal reviews and coach insights.
        </Text>
        <Button
          label={pushBusy ? 'Checking…' : 'Enable phone notifications'}
          variant="secondary"
          disabled={pushBusy}
          onPress={() => void enablePush()}
        />
        <Button label="Open phone Settings" variant="outline" onPress={() => void Linking.openSettings()} />
        {pushMessage ? <Text className="text-sm text-neutral-600">{pushMessage}</Text> : null}
      </View>

      <QuietHoursPicker
        start={settings.quietHoursStart}
        end={settings.quietHoursEnd}
        onChangeStart={(quietHoursStart) => persist({ ...settings, quietHoursStart })}
        onChangeEnd={(quietHoursEnd) => persist({ ...settings, quietHoursEnd })}
      />

      <View className="gap-4 rounded-2xl border border-ash-grey-100 bg-white p-4 shadow-sm">
        <Text className="font-sans-semibold text-base text-neutral-900">Nudge types</Text>
        <Text className="-mt-2 text-sm text-neutral-500">Choose which local reminders you receive.</Text>

        {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((key) => (
          <View key={key} className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="font-sans-medium text-sm text-neutral-900">{CATEGORY_LABELS[key].title}</Text>
              <Text className="mt-0.5 text-xs text-neutral-500">{CATEGORY_LABELS[key].description}</Text>
            </View>
            <Switch
              value={settings.categories[key]}
              onValueChange={(enabled) =>
                persist({
                  ...settings,
                  categories: { ...settings.categories, [key]: enabled },
                })
              }
            />
          </View>
        ))}
      </View>
    </View>
  );
}
