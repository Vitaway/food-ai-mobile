import { LinearGradient } from 'expo-linear-gradient';
import { type PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/design-system/colors';

type GradientHeaderProps = PropsWithChildren<{
  height?: number;
  style?: ViewStyle;
}>;

export function GradientHeader({ children, height, style }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[palette['blue-spruce'][700], palette['blue-spruce'][500], palette['blue-spruce'][400]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
