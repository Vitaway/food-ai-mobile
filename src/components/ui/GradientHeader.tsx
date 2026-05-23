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
}>;

export function ContentSheet({ children, className }: ContentSheetProps) {
  return (
    <View className={`flex-1 -mt-10 rounded-t-[32px] bg-white px-5 pt-6 ${className ?? ''}`}>{children}</View>
  );
}
