import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISPLAY_TITLE_CLASS } from '@/constants/fonts';
import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { BRAND_NAVY } from '@/constants/brand';
import { cn } from '@/utils/cn';

export function AppSplashScreen() {
  const insets = useSafeAreaInsets();
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    textOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [logoOpacity, textOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{
        backgroundColor: BRAND_NAVY,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
      <Animated.View style={logoStyle}>
        <AppLogo size={160} />
      </Animated.View>

      <Animated.View style={textStyle} className="mt-8 items-center">
        <Text className={cn('text-3xl text-white', DISPLAY_TITLE_CLASS)}>{APP_NAME}</Text>
      </Animated.View>

      <View className="absolute bottom-12 items-center">
        <ActivityIndicator color="#ffffff" />
      </View>
    </View>
  );
}
