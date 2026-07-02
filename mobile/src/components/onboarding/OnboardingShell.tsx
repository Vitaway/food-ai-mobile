import { ArrowRight } from 'iconoir-react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';

type OnboardingStepDotsProps = {
  total: number;
  current: number;
};

export function OnboardingStepDots({ total, current }: OnboardingStepDotsProps) {
  return (
    <View className="flex-row items-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const active = index === current;
        return (
          <View
            key={index}
            className="rounded-full"
            style={{
              width: active ? 28 : 8,
              height: 8,
              backgroundColor: active ? palette.shamrock[500] : palette['ash-grey'][200],
            }}
          />
        );
      })}
    </View>
  );
}

type OnboardingNavButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'next' | 'finish';
};

export function OnboardingNavButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'next',
}: OnboardingNavButtonProps) {
  return (
    <Button
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      loadingLabel="Saving…"
      trailingIcon={loading ? undefined : ArrowRight}
      fullWidth={variant === 'finish'}
      className={variant === 'finish' ? 'w-full' : 'min-w-[132px]'}
    />
  );
}

type OnboardingShellProps = {
  /** Step title in the navy toolbar (hidden on intro). */
  headerTitle?: string;
  stepIndex: number;
  totalSteps: number;
  showBack?: boolean;
  onBack?: () => void;
  footer: ReactNode;
  footerLayout?: 'inline' | 'stacked';
  intro?: boolean;
  children: ReactNode;
};

const TOOLBAR_SLOT = 44;

export function OnboardingShell({
  headerTitle,
  stepIndex,
  totalSteps,
  showBack,
  onBack,
  footer,
  footerLayout = 'inline',
  intro = false,
  children,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();

  const swipeBackGesture = useMemo(() => {
    if (!showBack || !onBack) return Gesture.Pan().enabled(false);

    return Gesture.Pan()
      .activeOffsetX(24)
      .failOffsetY([-20, 20])
      .onEnd((event) => {
        if (event.translationX > 72 || event.velocityX > 450) {
          runOnJS(onBack)();
        }
      });
  }, [onBack, showBack]);

  return (
    <GestureDetector gesture={swipeBackGesture}>
      <View className="flex-1" style={{ backgroundColor: BRAND_HEADER_COLOR }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 14,
            paddingHorizontal: 16,
          }}>
          <View className="min-h-11 flex-row items-center">
            {showBack && onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 active:opacity-90">
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </Pressable>
            ) : (
              <View style={{ width: TOOLBAR_SLOT, height: TOOLBAR_SLOT }} />
            )}

            {!intro && headerTitle ? (
              <Text
                className="flex-1 px-2 text-center font-sans-semibold text-lg leading-snug text-white"
                numberOfLines={2}>
                {headerTitle}
              </Text>
            ) : (
              <View className="flex-1" />
            )}

            <View style={{ width: TOOLBAR_SLOT, height: TOOLBAR_SLOT }} />
          </View>
        </View>

        <View
          className="min-h-0 flex-1 bg-white px-5"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderCurve: 'continuous',
            ...Platform.select({
              ios: {
                shadowColor: '#051f1c',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
              },
              android: { elevation: 8 },
            }),
          }}>
          <View className="min-h-0 flex-1 pt-6">{children}</View>

          <View
            className="border-t border-ash-grey-100 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            {footerLayout === 'stacked' ? (
              <View className="gap-4">
                <OnboardingStepDots total={totalSteps} current={stepIndex} />
                {footer}
              </View>
            ) : (
              <View className="flex-row items-center justify-between gap-4">
                <OnboardingStepDots total={totalSteps} current={stepIndex} />
                {footer}
              </View>
            )}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}
