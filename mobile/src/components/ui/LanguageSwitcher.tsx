import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { semanticColors } from '@/design-system/colors';
import type { AppLocale } from '@/i18n/locales';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LanguageSwitcherProps = {
  /** Compact chips (settings). Segmented control (welcome). */
  variant?: 'compact' | 'labeled';
};

export function LanguageSwitcher({ variant = 'compact' }: LanguageSwitcherProps) {
  const { locale, locales, setLocale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [locale]);

  const selected = locales.find((item) => item.id === locale) ?? locales[0];

  const pick = (id: AppLocale) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocale(id);
    setExpanded(false);
  };

  if (variant === 'labeled') {
    return (
      <View className="w-full items-center px-1">
        <Text className="mb-2.5 text-[13px] font-sans-semibold text-neutral-500">
          {t.profile.language}
        </Text>

        {!expanded ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${selected.nativeLabel}. Change language`}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpanded(true);
            }}
            className="w-full max-w-[320px] flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 active:opacity-90"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: semanticColors.primary,
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}>
            <View className="flex-row items-center gap-3">
              <Text className="text-[22px] leading-7">{selected.flag}</Text>
              <View>
                <Text className="font-sans-bold text-[15px] text-blue-spruce-800">
                  {selected.nativeLabel}
                </Text>
                <Text className="text-xs text-neutral-500">{selected.label}</Text>
              </View>
            </View>
            <Text className="text-xs font-sans-semibold uppercase tracking-wide text-blue-spruce-600">
              {locale === 'fr' ? 'Changer' : locale === 'rw' ? 'Hindura' : 'Change'}
            </Text>
          </Pressable>
        ) : (
          <View
            className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white"
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 14,
              elevation: 3,
            }}>
            {locales.map((item, index) => {
              const isSelected = item.id === locale;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={item.nativeLabel}
                  onPress={() => pick(item.id as AppLocale)}
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-ash-grey-50 ${
                    index < locales.length - 1 ? 'border-b border-ash-grey-100' : ''
                  } ${isSelected ? 'bg-blue-spruce-50' : 'bg-white'}`}>
                  <Text className="text-[22px] leading-7">{item.flag}</Text>
                  <View className="min-w-0 flex-1">
                    <Text
                      className={`font-sans-bold text-[15px] ${
                        isSelected ? 'text-blue-spruce-800' : 'text-neutral-800'
                      }`}>
                      {item.nativeLabel}
                    </Text>
                    <Text className="text-xs text-neutral-500">{item.label}</Text>
                  </View>
                  {isSelected ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-spruce-600">
                      <Text className="text-[11px] font-sans-bold text-white">✓</Text>
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border border-ash-grey-300" />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-1">
      {locales.map((item) => {
        const isSelected = item.id === locale;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.nativeLabel}
            onPress={() => setLocale(item.id as AppLocale)}
            className={`rounded-xl px-3 py-1.5 ${
              isSelected ? 'bg-blue-spruce-700' : 'bg-ash-grey-100'
            }`}>
            <Text
              className={`text-xs font-sans-semibold uppercase ${
                isSelected ? 'text-white' : 'text-neutral-500'
              }`}>
              {item.id}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
