import { ArrowRight } from 'iconoir-react-native';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { GradientButton } from '@/components/ui/GradientButton';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
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
    <GradientButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      loadingLabel="Saving…"
      trailingIcon={loading ? undefined : ArrowRight}
      className={variant === 'finish' ? 'w-full' : 'min-w-[132px]'}
    />
  );
}

type OnboardingShellProps = {
  headerTitle: string;
  stepIndex: number;
  totalSteps: number;
  showBack?: boolean;
  showSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  footer: ReactNode;
  footerLayout?: 'inline' | 'stacked';
  intro?: boolean;
  hero?: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({
  headerTitle,
  stepIndex,
  totalSteps,
  showBack,
  showSkip,
  onBack,
  onSkip,
  footer,
  footerLayout = 'inline',
  intro = false,
  hero,
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
      <View className="flex-1 bg-blue-spruce-700">
        <GradientHeader style={{ paddingBottom: intro ? 52 : 44 }}>
          <View className="flex-row items-center justify-between gap-3">
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
              <View className="h-11 w-11 shrink-0" />
            )}

            {intro ? (
              <View className="flex-1 flex-row items-center justify-center gap-3">
                <AppLogo size={36} />
                <GradientHeaderTitle numberOfLines={1}>{headerTitle}</GradientHeaderTitle>
              </View>
            ) : (
              <GradientHeaderTitle className="flex-1 text-center" numberOfLines={2}>
                {headerTitle}
              </GradientHeaderTitle>
            )}

            {showSkip && onSkip ? (
              <Pressable onPress={onSkip} hitSlop={12} className="shrink-0 px-1 py-2">
                <Text className="font-sans-semibold text-sm text-white/90">Skip</Text>
              </Pressable>
            ) : (
              <View className="h-11 w-11 shrink-0" />
            )}
          </View>
        </GradientHeader>

        <ContentSheet className="flex-1 px-5">
          <View className="min-h-0 flex-1">
            {hero ? <View className="mb-4">{hero}</View> : null}
            <View className="min-h-0 flex-1">{children}</View>
          </View>

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
        </ContentSheet>
      </View>
    </GestureDetector>
  );
}
