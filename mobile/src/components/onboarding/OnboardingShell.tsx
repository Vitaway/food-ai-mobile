import { ArrowLeft, ArrowRight } from 'iconoir-react-native';
import { type ReactNode, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';

type OnboardingProgressBarProps = {
  percent: number;
};

export function OnboardingProgressBar({ percent }: OnboardingProgressBarProps) {
  const safe = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-blue-spruce-100">
        <View className="h-full rounded-full bg-blue-spruce-700" style={{ width: `${safe}%` }} />
      </View>
      <Text className="w-10 text-right text-xs font-sans-semibold text-neutral-500">{safe}%</Text>
    </View>
  );
}

/** @deprecated */
export function OnboardingStepDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const percent = Math.round(((current + 1) / Math.max(total, 1)) * 100);
  return <OnboardingProgressBar percent={percent} />;
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
      fullWidth
      size="lg"
      variant="primary"
      className={variant === 'finish' ? 'w-full' : 'w-full'}
    />
  );
}

type OnboardingShellProps = {
  headerTitle?: string;
  fillPercent: number;
  showBack?: boolean;
  onBack?: () => void;
  footer: ReactNode;
  intro?: boolean;
  banner?: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({
  headerTitle,
  fillPercent,
  showBack,
  onBack,
  footer,
  intro = false,
  banner,
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
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        <StatusBar style="dark" />

        <Animated.View entering={FadeIn.duration(400)} className="items-center px-4 py-1">
          <Text display className="text-[28px] text-blue-spruce-800">
            {APP_NAME}
          </Text>
        </Animated.View>

        {!intro && headerTitle ? (
          <Animated.View entering={FadeInDown.duration(320)} className="mt-3 px-6">
            <Text className="text-center font-sans-bold text-[26px] leading-8 text-neutral-900">
              {headerTitle}
            </Text>
          </Animated.View>
        ) : null}

        <View className="min-h-0 flex-1 px-5">
          <View className="min-h-0 flex-1 pt-3">
            {banner}
            {children}
          </View>

          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-4 pt-3">
            <OnboardingProgressBar percent={fillPercent} />
            <View className="flex-row items-center gap-3">
              {showBack && onBack ? (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  className="h-14 w-14 items-center justify-center rounded-2xl border border-ash-grey-200 bg-ash-grey-50 active:opacity-90">
                  <ArrowLeft width={22} height={22} color="#1f3a56" strokeWidth={2.2} />
                </Pressable>
              ) : null}
              <View className="min-w-0 flex-1">{footer}</View>
            </View>
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}
