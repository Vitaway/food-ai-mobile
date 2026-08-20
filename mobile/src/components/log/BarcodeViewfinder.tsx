import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type BarcodeViewfinderProps = {
  /** Wide frame for 1D barcodes (default). Square when false. */
  wide?: boolean;
};

/** Horizontal viewfinder — barcodes are wide, not square. */
export function BarcodeViewfinder({ wide = true }: BarcodeViewfinderProps) {
  const pulse = useSharedValue(0);
  const scanY = useSharedValue(0);
  const frameWidth = wide ? 300 : 220;
  const frameHeight = wide ? 132 : 220;

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
    scanY.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse, scanY]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.9]),
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * (frameHeight - 40) }],
  }));

  return (
    <View className="items-center" pointerEvents="none">
      <View style={{ width: frameWidth, height: frameHeight }}>
        <View className="absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
        <View className="absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
        <View className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
        <View className="absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />

        <Animated.View
          style={[
            scanLineStyle,
            {
              position: 'absolute',
              left: 14,
              right: 14,
              top: 16,
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.95)',
              shadowColor: '#fff',
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
          ]}
        />

        <View className="absolute inset-0 items-center justify-center">
          <Animated.View style={pulseStyle} className="h-px w-[78%] bg-white/40" />
        </View>
      </View>
    </View>
  );
}
