import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import type { AppLocale } from '@/i18n/locales';

type LanguageSwitcherProps = {
  /** Compact chips (settings). Labeled row with flags (welcome). */
  variant?: 'compact' | 'labeled';
};

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { locale, locales, setLocale, t } = useI18n();

  if (variant === 'labeled') {
    return (
      <View className="w-full flex-row items-center justify-center gap-3 px-2">
        <Text className="text-[15px] font-sans-semibold text-neutral-700">{t.profile.language}</Text>
        <View className="flex-row items-center gap-2">
          {locales.map((item) => {
            const selected = item.id === locale;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.nativeLabel}
                onPress={() => setLocale(item.id as AppLocale)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                  selected
                    ? 'border-blue-spruce-700 bg-blue-spruce-700'
                    : 'border-ash-grey-200 bg-ash-grey-50'
                }`}>
                <Text className="text-[15px] leading-5">{item.flag}</Text>
                <Text
                  className={`text-xs font-sans-semibold uppercase ${
                    selected ? 'text-white' : 'text-neutral-600'
                  }`}>
                  {item.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-1">
      {locales.map((item) => {
        const selected = item.id === locale;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.nativeLabel}
            onPress={() => setLocale(item.id as AppLocale)}
            className={`rounded-full px-3 py-1.5 ${
              selected ? 'bg-blue-spruce-700' : 'bg-ash-grey-100'
            }`}>
            <Text
              className={`text-xs font-sans-semibold uppercase ${
                selected ? 'text-white' : 'text-neutral-500'
              }`}>
              {item.id}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
