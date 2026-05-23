import { ArrowRight, NavArrowLeft } from 'iconoir-react-native';
import { Pressable, View } from 'react-native';
import { type ReactNode } from 'react';

import { IconoirIcon } from '@/components/ui/IconoirIcon';
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
              backgroundColor: active ? palette['blue-spruce'][600] : palette['blue-spruce'][200],
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
  const isFinish = variant === 'finish';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2.5 rounded-full py-4 ${
        isFinish ? 'w-full px-8' : 'min-w-[120px] px-6'
      }`}
      style={{
        backgroundColor: palette['blue-spruce'][600],
        opacity: disabled || loading ? 0.55 : 1,
      }}>
      <Text className="font-sans-semibold text-base text-white">{loading ? 'Saving…' : label}</Text>
      {!loading ? <IconoirIcon icon={ArrowRight} size={18} color="#ffffff" /> : null}
    </Pressable>
  );
}

type OnboardingShellProps = {
  stepIndex: number;
  totalSteps: number;
  showBack?: boolean;
  showSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  footer: ReactNode;
  footerLayout?: 'inline' | 'stacked';
  showHeader?: boolean;
  hero?: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({
  stepIndex,
  totalSteps,
  showBack,
  showSkip,
  onBack,
  onSkip,
  footer,
  footerLayout = 'inline',
  showHeader = true,
  hero,
  children,
}: OnboardingShellProps) {
  return (
    <View className="flex-1 bg-white">
      {showHeader ? (
        <View
          className="z-10 flex-row items-center justify-between border-b border-ash-grey-100 bg-white px-6 py-3"
          style={{ minHeight: 52 }}>
          {showBack ? (
          <Pressable onPress={onBack} hitSlop={12} className="flex-row items-center gap-1 py-1">
            <IconoirIcon icon={NavArrowLeft} size={20} color="#4f5346" />
            <Text className="font-sans-medium text-base text-neutral-600">Back</Text>
          </Pressable>
          ) : (
            <View style={{ width: 64 }} />
          )}

          {showSkip ? (
            <Pressable onPress={onSkip} hitSlop={12} className="py-1">
              <Text className="font-sans-medium text-sm text-neutral-500">Skip</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      ) : null}

      {hero ? <View className="px-6 pt-2">{hero}</View> : null}

      <View className="min-h-0 flex-1 px-6">{children}</View>

      <View
        className="border-t border-ash-grey-100 bg-white"
        style={{
          shadowColor: '#1a1c17',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 8,
        }}>
        {footerLayout === 'stacked' ? (
          <View className="gap-4 px-6 pb-2 pt-4">
            <OnboardingStepDots total={totalSteps} current={stepIndex} />
            {footer}
          </View>
        ) : (
          <View className="flex-row items-center justify-between px-6 pb-2 pt-4">
            <OnboardingStepDots total={totalSteps} current={stepIndex} />
            {footer}
          </View>
        )}
      </View>
    </View>
  );
}
