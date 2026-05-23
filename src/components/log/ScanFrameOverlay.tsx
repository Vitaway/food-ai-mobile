import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/design-system/colors';

export function ScanFrameOverlay() {
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scanY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * 200 }],
  }));

  return (
    <View className="absolute inset-0 items-center justify-center">
      <View className="h-[240px] w-[240px]">
        <View className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-shamrock-400" />
        <View className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-shamrock-400" />
        <View className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-shamrock-400" />
        <View className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-shamrock-400" />

        <Animated.View
          style={[
            scanLineStyle,
            {
              position: 'absolute',
              left: 12,
              right: 12,
              top: 16,
              height: 2,
              backgroundColor: palette.shamrock[400],
              shadowColor: palette.shamrock[400],
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
          ]}
        />
      </View>
    </View>
  );
}
