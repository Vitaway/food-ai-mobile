import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { palette } from '@/design-system/colors';
import { cn } from '@/utils/cn';

type ScreenTopBarProps = {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
};

export const STACK_HEADER_BOTTOM_PADDING = 28;

export function ScreenTopBar({ title, onBack, rightAction, className }: ScreenTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[palette['blue-spruce'][700], palette['blue-spruce'][500], palette['blue-spruce'][400]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn(className)}
      style={{
        paddingTop: insets.top + 4,
        paddingBottom: STACK_HEADER_BOTTOM_PADDING,
        paddingHorizontal: 20,
      }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </Pressable>
          ) : null}
          <GradientHeaderTitle className="flex-1" numberOfLines={1}>
            {title}
          </GradientHeaderTitle>
        </View>
        {rightAction}
      </View>
    </LinearGradient>
  );
}

type StackScreenBodyProps = {
  children: React.ReactNode;
  className?: string;
};

/** White sheet that overlaps the gradient header */
export function StackScreenBody({ children, className }: StackScreenBodyProps) {
  return (
    <View
      className={cn('min-h-0 flex-1 bg-white', className)}
      style={{
        marginTop: -16,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderCurve: 'continuous',
        overflow: 'hidden',
      }}>
      {children}
    </View>
  );
}
