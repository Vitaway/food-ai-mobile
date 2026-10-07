import type { ComponentType } from 'react';
import { cn } from '@/utils/cn';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { fonts } from '@/constants/fonts';
import {
  BRUTAL_BUTTON,
  type BrutalButtonSize,
  type BrutalButtonVariant,
} from '@/design-system/brutalButton';
import { Text } from './Text';

type ButtonVariant = BrutalButtonVariant;
type ButtonSize = BrutalButtonSize;

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ComponentType<SvgProps>;
  trailingIcon?: ComponentType<SvgProps>;
  iconSize?: number;
  className?: string;
  textClassName?: string;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingLabel = 'Loading…',
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  iconSize = 18,
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  const tokens = BRUTAL_BUTTON.variants[variant];
  const sizeTokens = BRUTAL_BUTTON.sizes[size];
  const { borderWidth, borderRadius } = BRUTAL_BUTTON;
  const isDisabled = Boolean(disabled || loading);
  const displayLabel = loading ? loadingLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(fullWidth && 'w-full', className)}
      style={isDisabled && !loading ? styles.disabledHost : undefined}
      {...props}>
      {({ pressed }) => {
        const isPressed = pressed && !isDisabled;
        const pressedFaceBg = 'pressedFaceBg' in tokens ? tokens.pressedFaceBg : undefined;
        const faceBackground = isPressed && pressedFaceBg ? pressedFaceBg : tokens.faceBg;

        const faceStyle: ViewStyle = {
          minHeight: sizeTokens.minHeight,
          paddingHorizontal: sizeTokens.paddingHorizontal,
          paddingVertical: sizeTokens.paddingVertical,
          backgroundColor: faceBackground,
          borderWidth: tokens.border === 'transparent' ? 0 : borderWidth,
          borderColor: tokens.border,
          borderRadius,
          opacity: isPressed ? 0.9 : loading ? 0.92 : 1,
        };

        const labelStyle: TextStyle = {
          color: tokens.text,
          fontSize: sizeTokens.fontSize,
          lineHeight: Math.round(sizeTokens.fontSize * 1.35),
          fontFamily: fonts.sansSemiBold,
        };

        return (
          <View className={cn(fullWidth && 'w-full')}>
            <View style={[styles.face, faceStyle, fullWidth && styles.faceFull]}>
              <View style={styles.labelRow}>
                {loading ? (
                  <ActivityIndicator size="small" color={tokens.text} />
                ) : LeadingIcon ? (
                  <LeadingIcon width={iconSize} height={iconSize} color={tokens.text} strokeWidth={2} />
                ) : null}
                <Text
                  className={cn('text-center', textClassName)}
                  style={[styles.label, labelStyle]}>
                  {displayLabel}
                </Text>
                {!loading && TrailingIcon ? (
                  <TrailingIcon width={iconSize} height={iconSize} color={tokens.text} strokeWidth={2} />
                ) : null}
              </View>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabledHost: {
    opacity: 0.5,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  faceFull: {
    alignSelf: 'stretch',
    width: '100%',
  },
  label: {
    fontWeight: '400',
  },
});
