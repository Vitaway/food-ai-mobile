import { useCallback, useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { QuietHoursPicker } from '@/components/notifications/QuietHoursPicker';
import { Text } from '@/components/ui/Text';
import { services } from '@/services';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationCategory,
  type NotificationSettings,
} from '@/services/local/notificationPreferences';

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

  if (!loaded) return null;

  return (
    <View className="gap-5">
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
