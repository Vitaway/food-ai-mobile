import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import {
  BRAND_GRADIENT_COLORS,
  BRAND_GRADIENT_END,
  BRAND_GRADIENT_START,
} from '@/components/ui/GradientHeader';
import { cn } from '@/utils/cn';

type GradientButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
  trailingIcon?: ComponentType<SvgProps>;
  iconSize?: number;
};

export function GradientButton({
  label,
  loading,
  loadingLabel = 'Loading…',
  disabled,
  className,
  trailingIcon: TrailingIcon,
  iconSize = 18,
  ...props
}: GradientButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn('overflow-hidden rounded-2xl', isDisabled && 'opacity-55', className)}
      {...props}>
      <LinearGradient
        colors={[...BRAND_GRADIENT_COLORS]}
        start={BRAND_GRADIENT_START}
        end={BRAND_GRADIENT_END}
        style={{
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}>
        <Text className="font-sans-semibold text-base text-white">{loading ? loadingLabel : label}</Text>
        {!loading && TrailingIcon ? (
          <View>
            <TrailingIcon width={iconSize} height={iconSize} color="#ffffff" strokeWidth={2} />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}
