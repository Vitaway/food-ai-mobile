import type { ComponentProps, ReactNode } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export const layoutSpring = LinearTransition.springify().damping(18).stiffness(220);

export function enteringCard(index = 0) {
  return FadeInDown.delay(Math.min(index, 8) * 55)
    .springify()
    .damping(16)
    .stiffness(200);
}

export function enteringScreen() {
  return FadeInUp.springify().damping(18).stiffness(180);
}

export function enteringPop() {
  return ZoomIn.springify().damping(14).stiffness(220);
}

type AnimatedPressableProps = ComponentProps<typeof Pressable> & {
  children: ReactNode;
};

export function AnimatedScalePressable({ children, onPressIn, onPressOut, style, ...props }: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...props}
      style={style}
      onPressIn={(event) => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(event);
      }}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

export const MotionView = Animated.View;
