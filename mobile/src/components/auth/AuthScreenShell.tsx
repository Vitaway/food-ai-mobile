import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
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
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  actions,
  footer,
  scrollable = true,
  cardClassName = 'px-6 py-7',
  contentStyle,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();

  const body = (
    <View
      className="flex-1 justify-center px-5"
      style={[{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }, contentStyle]}>
      <View className={cn('rounded-[28px] bg-white shadow-xl', cardClassName)}>
        <View className="mb-6 items-center">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FA]">
            <AppLogo size={36} />
          </View>
          <Text className="mt-4 text-center text-[28px] font-sans-bold text-neutral-900">{title}</Text>
          {subtitle ? (
            <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">{subtitle}</Text>
          ) : null}
        </View>

        {children}

        {actions ? <View className="mt-6">{actions}</View> : null}

        {footer ? <View className="mt-5">{footer}</View> : null}
      </View>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: BRAND_HEADER_COLOR }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {scrollable ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
