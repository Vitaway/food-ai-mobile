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

import { DISPLAY_TITLE_CLASS } from '@/constants/fonts';
import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { cn } from '@/utils/cn';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Primary CTA rendered below the white card (on the brand background). */
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
  cardClassName = 'px-5 py-8',
  contentStyle,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();

  const body = (
    <View className="flex-1" style={[{ paddingTop: insets.top + 40 }, contentStyle]}>
      <View className="items-center px-6">
        <AppLogo size={72} />
        <Text className={cn('mt-6 text-center text-3xl text-white', DISPLAY_TITLE_CLASS)}>{title}</Text>
        <Text className="mt-2 text-center text-base leading-6 text-white/75">{subtitle}</Text>
      </View>

      <View className={`mx-6 mt-10 rounded-3xl bg-white shadow-lg ${cardClassName}`}>{children}</View>

      {actions ? <View className="mt-6 px-6">{actions}</View> : null}

      {footer ? <View className="mt-6 px-6 pb-4">{footer}</View> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BRAND_HEADER_COLOR }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {scrollable ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingBottom: insets.bottom + 24 }}>{body}</View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}