import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { palette } from '@/design-system/colors';

/** Phase 7 stub — native widgets land later; this is the deep-link placeholder. */
export default function WidgetsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-ash-grey-50" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          accessibilityLabel={t.common.close}>
          <Ionicons name="close" size={22} color={palette['blue-spruce'][800]} />
        </Pressable>
        <Text className="font-sans-semibold text-sm text-blue-spruce-800">{t.widgets.title}</Text>
        <View className="h-11 w-11" />
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-blue-spruce-800">
          <Ionicons name="phone-portrait-outline" size={36} color="#ffffff" />
        </View>
        <Text className="mt-6 text-center font-sans-bold text-3xl text-blue-spruce-900">
          {t.widgets.headline}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ash-grey-600">
          {t.widgets.body}
        </Text>

        <View className="mt-8 w-full gap-2.5">
          {([t.widgets.itemHome, t.widgets.itemLock, t.widgets.itemReminders] as const).map((item) => (
            <View
              key={item}
              className="flex-row items-center gap-3 rounded-2xl border border-ash-grey-100 bg-white px-4 py-3.5">
              <Ionicons name="ellipse" size={8} color={palette['blue-spruce'][500]} />
              <Text className="flex-1 font-sans-semibold text-[15px] text-blue-spruce-900">{item}</Text>
              <Text className="text-[11px] font-sans-bold uppercase tracking-wide text-ash-grey-400">
                {t.widgets.soon}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <Button label={t.widgets.openReminders} variant="primary" fullWidth onPress={() => router.push('/notifications')} />
        <View className="mt-2">
          <Button label={t.common.close} variant="outline" fullWidth onPress={() => router.back()} />
        </View>
      </View>
    </View>
  );
}
