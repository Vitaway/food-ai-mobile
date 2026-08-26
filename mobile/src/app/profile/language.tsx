import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { palette } from '@/design-system/colors';
import { useProfileBack } from '@/hooks/useProfileBack';
import type { AppLocale } from '@/i18n/locales';

export default function LanguageSettingsScreen() {
  const handleBack = useProfileBack();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { t, locale, locales, detectedLocale, setLocale } = useI18n();
  const [draft, setDraft] = useState<AppLocale>(locale);

  useEffect(() => {
    setDraft(locale);
  }, [locale]);

  const dirty = draft !== locale;
  const detectedLabel = useMemo(
    () => locales.find((item) => item.id === detectedLocale)?.nativeLabel ?? detectedLocale,
    [detectedLocale, locales],
  );
  const navy = palette['blue-spruce'];

  const handleSave = () => {
    if (!dirty) return;
    setLocale(draft);
    toast.success(t.profile.languageSaved, t.profile.language);
    handleBack();
  };

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title={t.profile.language} onBack={handleBack} />
      <StackScreenBody className="bg-ash-grey-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5 pb-4 pt-5"
          contentContainerStyle={{ paddingBottom: 120 + Math.max(insets.bottom, 12) }}>
          <FreePlanBanner compact />

          <View>
            <Text className="font-sans-bold text-[22px] text-blue-spruce-900">
              {t.profile.languageHint}
            </Text>
            <Text className="mt-1.5 text-sm leading-5 text-ash-grey-600">
              {t.profile.languageSubtitle}
            </Text>
            <View
              className="mt-3 flex-row items-center gap-2 self-start rounded-full px-3 py-1.5"
              style={{ backgroundColor: navy[50] }}>
              <Ionicons name="phone-portrait-outline" size={14} color={navy[700]} />
              <Text className="text-[12px] font-sans-semibold text-blue-spruce-800">
                {t.profile.languageDetected}: {detectedLabel}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            {locales.map((item) => {
              const selected = item.id === draft;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDraft(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="overflow-hidden rounded-[22px] bg-white active:opacity-95"
                  style={{
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? navy[700] : palette['ash-grey'][100],
                    shadowColor: navy[900],
                    shadowOpacity: selected ? 0.1 : 0.03,
                    shadowRadius: selected ? 14 : 6,
                    shadowOffset: { width: 0, height: selected ? 6 : 2 },
                    elevation: selected ? 3 : 1,
                  }}>
                  <View className="flex-row items-center gap-4 px-4 py-4">
                    <View
                      className="h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: selected ? navy[50] : palette['ash-grey'][50] }}>
                      <Text className="text-[28px] leading-9">{item.flag}</Text>
                    </View>

                    <View className="min-w-0 flex-1">
                      <Text className="font-sans-bold text-[17px] text-neutral-900">
                        {item.nativeLabel}
                      </Text>
                      <Text className="mt-0.5 text-sm text-ash-grey-500">{item.label}</Text>
                      {item.id === detectedLocale ? (
                        <Text className="mt-1 text-[11px] font-sans-semibold text-blue-spruce-600">
                          {t.profile.languageDetected}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      className="h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        borderWidth: 2,
                        borderColor: selected ? navy[700] : palette['ash-grey'][300],
                        backgroundColor: selected ? navy[700] : 'transparent',
                      }}>
                      {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-ash-grey-100 bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
          <Button
            label={t.profile.languageSave}
            variant="primary"
            fullWidth
            disabled={!dirty}
            onPress={handleSave}
          />
        </View>
      </StackScreenBody>
    </View>
  );
}
