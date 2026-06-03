import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { cn } from '@/utils/cn';

/** Navy gradient used on top headers and the floating tab bar. */
export const BRAND_GRADIENT_COLORS = [
  palette['blue-spruce'][700],
  palette['blue-spruce'][500],
  palette['blue-spruce'][400],
] as const;

export const BRAND_GRADIENT_START = { x: 0, y: 0 } as const;
export const BRAND_GRADIENT_END = { x: 1, y: 1 } as const;

/** Shared title style for tab gradient headers (Home, Log, Insights) and stack screens. */
export const GRADIENT_HEADER_TITLE_CLASS = 'font-sans-bold text-3xl leading-tight text-white';

type GradientHeaderTitleProps = {
  children: ReactNode;
  className?: string;
  numberOfLines?: number;
};

export function GradientHeaderTitle({ children, className, numberOfLines = 2 }: GradientHeaderTitleProps) {
  return (
    <Text className={cn(GRADIENT_HEADER_TITLE_CLASS, className)} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

type GradientHeaderProps = PropsWithChildren<{
  height?: number;
  style?: ViewStyle;
}>;

export function GradientHeader({ children, height, style }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...BRAND_GRADIENT_COLORS]}
      start={BRAND_GRADIENT_START}
      end={BRAND_GRADIENT_END}
      style={[{ paddingTop: insets.top + 12, paddingBottom: 48, paddingHorizontal: 20 }, height ? { minHeight: height } : null, style]}>
      {children}
    </LinearGradient>
  );
}

type ContentSheetProps = PropsWithChildren<{
  className?: string;
  style?: ViewStyle;
}>;

/** Overlap between the gradient header and the white content sheet (matches `-mt-10`). */
export const CONTENT_SHEET_OVERLAP = 40;

export function ContentSheet({ children, className, style }: ContentSheetProps) {
  return (
    <View
      className={`min-h-0 flex-1 px-5 pt-6 ${className ?? ''}`}
      style={{
        flex: 1,
        marginTop: -CONTENT_SHEET_OVERLAP,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderCurve: 'continuous',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        zIndex: 2,
        shadowColor: '#051f1c',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 12,
        ...style,
      }}>
      {children}
    </View>
  );
}
