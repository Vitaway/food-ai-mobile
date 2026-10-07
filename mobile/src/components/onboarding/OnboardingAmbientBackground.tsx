import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { palette, semanticColors } from '@/design-system/colors';

type BlobProps = {
  size: number;
  color: string;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  delayMs?: number;
  travel?: number;
  durationMs?: number;
};

function FloatingBlob({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delayMs = 0,
  travel = 14,
  durationMs = 5200,
}: BlobProps) {
  const y = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    y.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-travel, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
          withTiming(travel, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: durationMs * 1.1, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: durationMs * 1.1, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delayMs, durationMs, scale, travel, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          right,
          bottom,
        },
        style,
      ]}
    />
  );
}

/** Soft mint atmosphere — kept toward edges so form fields stay readable. */
export function OnboardingAmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <FloatingBlob
        size={200}
        color={`${palette['blue-spruce'][200]}55`}
        top={-50}
        right={-70}
        delayMs={0}
        travel={14}
        durationMs={6400}
      />
      <FloatingBlob
        size={160}
        color={`${palette.shamrock[200]}44`}
        top={80}
        left={-80}
        delayMs={400}
        travel={12}
        durationMs={7000}
      />
      <FloatingBlob
        size={120}
        color={`${palette['ash-grey'][300]}55`}
        bottom={100}
        right={-40}
        delayMs={800}
        travel={10}
        durationMs={5600}
      />
      <FloatingBlob
        size={70}
        color={`${semanticColors.primary}14`}
        bottom={280}
        left={20}
        delayMs={1200}
        travel={8}
        durationMs={4800}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
