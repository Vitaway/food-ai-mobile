import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import {
  requestPushPermissions,
  syncPushTokenWithServer,
} from '@/services/push/pushNotifications';
import { markPushPromptSeen } from '@/utils/pushPrompt';

export default function EnablePushNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const isSimulator = !Constants.isDevice;

  async function finish(enabled: boolean) {
    if (busy) return;
    setBusy(true);
    setStatus(null);

    // Clear the gate BEFORE any push work / navigation so AuthGuard cannot bounce us back.
    await markPushPromptSeen();
    router.replace('/(tabs)');

    if (!enabled) {
      setBusy(false);
      return;
    }

    // Simulators cannot receive remote push — leave immediately after clearing the gate.
    if (isSimulator) {
      setBusy(false);
      return;
    }

    try {
      const granted = await requestPushPermissions();
      if (granted) {
        await Promise.race([
          syncPushTokenWithServer(),
          new Promise((resolve) => setTimeout(resolve, 8000)),
        ]);
      }
    } catch {
      // Already navigated away — ignore.
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="flex-1 justify-center px-6">
        <View className="mb-6 h-16 w-16 items-center justify-center rounded-3xl bg-blue-spruce-50">
          <Ionicons name="notifications-outline" size={32} color={semanticColors.primary} />
        </View>
        <Text className="font-sans-bold text-3xl text-neutral-900">Stay in the loop</Text>
        <Text className="mt-3 text-base leading-6 text-neutral-600">
          Turn on notifications so you get meal review updates, coach insights, and reminders — even when
          MiraFood is closed.
        </Text>

        <View className="mt-8 gap-3">
          {[
            'Coach approved or updated a meal',
            'New coaching insight for you',
            'Hydration and logging reminders',
          ].map((line) => (
            <View key={line} className="flex-row items-start gap-3">
              <Ionicons name="checkmark-circle" size={20} color="#1D9E75" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-sm leading-5 text-neutral-700">{line}</Text>
            </View>
          ))}
        </View>
        {isSimulator ? (
          <Text className="mt-4 text-sm text-neutral-500">
            Simulators can't receive push alerts. You can continue — try on a real device to enable them.
          </Text>
        ) : null}
        {status ? <Text className="mt-4 text-sm text-neutral-500">{status}</Text> : null}
      </View>

      <View className="gap-3 px-6">
        <Button
          label={busy ? 'Continuing…' : isSimulator ? 'Continue' : 'Enable notifications'}
          variant="secondary"
          onPress={() => void finish(true)}
        />
        <Pressable onPress={() => void finish(false)} disabled={busy} className="py-3">
          <Text className="text-center text-sm font-sans-semibold text-neutral-500">Not now</Text>
        </Pressable>
        {!isSimulator ? (
          <Pressable onPress={() => void Linking.openSettings()} className="py-1">
            <Text className="text-center text-xs text-neutral-400">Open phone Settings</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
