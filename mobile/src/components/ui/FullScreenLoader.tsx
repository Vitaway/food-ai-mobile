import { Modal, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';

type FullScreenLoaderProps = {
  visible: boolean;
  message?: string;
};

export function FullScreenLoader({ visible, message = 'Just a moment…' }: FullScreenLoaderProps) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.85);

  useEffect(() => {
    if (!visible) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    ring.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withTiming(0.85, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [visible, pulse, ring]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1.4 - ring.value,
    transform: [{ scale: ring.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-[#051f1c]/88">
        <Animated.View entering={FadeIn.duration(220)} className="items-center px-10">
          <View className="h-36 w-36 items-center justify-center">
            <Animated.View
              style={[
                ringStyle,
                {
                  position: 'absolute',
                  height: 128,
                  width: 128,
                  borderRadius: 64,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.35)',
                },
              ]}
            />
            <Animated.View style={logoStyle}>
              <AppLogo size={88} />
            </Animated.View>
          </View>

          <Text display className="mt-6 text-[28px] text-white">
            {APP_NAME}
          </Text>
          <Text className="mt-3 text-center text-[15px] leading-6 text-white/80">{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
