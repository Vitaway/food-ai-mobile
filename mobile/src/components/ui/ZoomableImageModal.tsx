import { useEffect } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';

type ZoomableImageModalProps = {
  visible: boolean;
  uri?: string | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function ZoomableImageModal({ visible, uri, onClose }: ZoomableImageModalProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = Dimensions.get('window');

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [visible, uri, scale, savedScale, translateX, translateY, savedX, savedY]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = withTiming(2.2);
        savedScale.value = 2.2;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center" style={{ width: screenW, height: screenH }}>
          {uri ? (
            <GestureDetector gesture={composed}>
              <Animated.View style={[{ width: screenW, height: screenH * 0.85 }, imageStyle]}>
                <ResolvedImage uri={uri} className="h-full w-full" resizeMode="contain" />
              </Animated.View>
            </GestureDetector>
          ) : (
            <Text className="text-base text-white">No image</Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close image viewer"
          className="absolute right-5 h-11 w-11 items-center justify-center rounded-full bg-white/15"
          style={{ top: insets.top + 10 }}>
          <Ionicons name="close" size={22} color="#ffffff" />
        </Pressable>

        <Text
          className="absolute self-center text-xs text-white/55"
          style={{ bottom: Math.max(insets.bottom, 12) + 8 }}>
          Pinch to zoom · double-tap to reset
        </Text>
      </View>
    </Modal>
  );
}
