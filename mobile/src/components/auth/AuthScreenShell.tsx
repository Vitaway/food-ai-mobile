import type { ReactNode } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

type AuthScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Primary CTA rendered inside the white card (below children). */
  actions?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  cardClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /** When false, tapping the dimmed welcome backdrop does nothing. Default true. */
  dismissible?: boolean;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  actions,
  footer,
  scrollable = true,
  cardClassName = 'px-6 pt-3 pb-4',
  contentStyle,
  dismissible = true,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const maxHeight = Math.round(Dimensions.get('window').height * 0.72);

  const dismiss = () => {
    if (!dismissible) return;
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/welcome');
  };

  const inner = (
    <>
      <Pressable onPress={dismiss} hitSlop={8} className="mb-3 items-center py-1">
        <View className="h-1.5 w-12 rounded-full bg-ash-grey-200" />
      </Pressable>

      <View className="mb-5">
        <Text className="text-center font-sans-bold text-[28px] text-neutral-900">{title}</Text>
        {subtitle ? (
          <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">{subtitle}</Text>
        ) : null}
      </View>

      {children}

      {actions ? <View className="mt-6">{actions}</View> : null}
      {footer ? <View className="mt-5">{footer}</View> : null}
    </>
  );

  return (
    <View className="flex-1 justify-end" style={{ backgroundColor: 'transparent' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={dismiss}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(5, 31, 28, 0.28)' }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <View
          className={cn('w-full rounded-t-[32px] bg-white', cardClassName)}
          style={[
            {
              maxHeight,
              paddingBottom: Math.max(insets.bottom, 16),
              borderCurve: 'continuous',
            },
            contentStyle,
          ]}>
          {scrollable ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}>
              {inner}
            </ScrollView>
          ) : (
            inner
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
