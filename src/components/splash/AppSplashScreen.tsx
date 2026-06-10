import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { BRAND_NAVY, BRAND_ORANGE } from '@/constants/brand';

export function AppSplashScreen() {
  const insets = useSafeAreaInsets();
  const logoScale = useSharedValue(0.88);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.92);
  const ringOpacity = useSharedValue(0.35);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 1200 }), withTiming(0.25, { duration: 1200 })),
      -1,
      true,
    );
    ringScale.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1200 }), withTiming(0.94, { duration: 1200 })),
      -1,
      true,
    );
    textOpacity.value = withDelay(280, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(280, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [logoOpacity, logoScale, ringOpacity, ringScale, textOpacity, textTranslateY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[BRAND_NAVY, '#1A3A5C', '#21466B']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center justify-center">
            <Animated.View
              style={[
                ringStyle,
                {
                  position: 'absolute',
                  width: 176,
                  height: 176,
                  borderRadius: 88,
                  borderWidth: 2,
                  borderColor: `${BRAND_ORANGE}66`,
                },
              ]}
            />
            <Animated.View style={logoStyle}>
              <AppLogo size={128} />
            </Animated.View>
          </View>

          <Animated.View style={textStyle} className="mt-10 items-center">
            <Text className="font-sans-bold text-4xl tracking-tight text-white">{APP_NAME}</Text>
            <Text className="mt-4 text-center text-sm leading-5 text-white/70">
              Smart nutrition tracking, powered by AI
            </Text>
          </Animated.View>
        </View>

        <View className="items-center pb-10">
          <ActivityIndicator color="#ffffff" />
        </View>
      </LinearGradient>
    </View>
  );
}
