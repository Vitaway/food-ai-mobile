import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, FadeOut, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Href } from 'expo-router';

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { useI18n } from '@/context/LocaleContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';

const SLIDE_INTERVAL_MS = 4000;

const SLIDE_IMAGES = [
  require('../../assets/images/welcome/eat-healthy.png'),
  require('../../assets/images/welcome/coach.png'),
  require('../../assets/images/welcome/progress.png'),
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useNavigateOnce();
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const indexRef = useRef(0);
  const slides = t.welcome.slides;
  const count = slides.length;
  const slide = slides[index] ?? slides[0];

  const goTo = (next: number) => {
    const bounded = ((next % count) + count) % count;
    indexRef.current = bounded;
    setIndex(bounded);
  };

  const goToAndResetTimer = (next: number) => {
    goTo(next);
    setCycle((value) => value + 1);
  };

  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => {
      goTo(indexRef.current + 1);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, cycle]);

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      if (event.translationX < -40) {
        runOnJS(goToAndResetTimer)(indexRef.current + 1);
      } else if (event.translationX > 40) {
        runOnJS(goToAndResetTimer)(indexRef.current - 1);
      }
    });

  return (
    <View className="flex-1 bg-ash-grey-50" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeIn.duration(400)} className="mt-2 items-center px-5">
        <Text display className="text-[34px] text-blue-spruce-800">
          {APP_NAME}
        </Text>
      </Animated.View>

      <GestureDetector gesture={swipe}>
        <View className="min-h-0 flex-1 items-center justify-center px-8">
          {slide ? (
            <Animated.View
              key={`${index}-${slide.title}`}
              entering={FadeIn.duration(280)}
              exiting={FadeOut.duration(180)}
              className="w-full items-center">
              <Image
                source={SLIDE_IMAGES[index]}
                style={{ width: 240, height: 240, backgroundColor: 'transparent' }}
                resizeMode="contain"
              />
              <Text className="mt-4 text-center font-sans-bold text-[28px] leading-9 text-neutral-900">
                {slide.title}
              </Text>
              <Text className="mt-3 text-center text-[16px] leading-6 text-neutral-500">
                {slide.body}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </GestureDetector>

      <Animated.View
        entering={FadeInDown.delay(120).duration(320)}
        className="px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <View className="mb-5">
          <LanguageSwitcher variant="labeled" />
        </View>

        <View className="mb-5 flex-row items-center justify-center gap-2">
          {slides.map((_, i) => (
            <Pressable key={`dot-${i}`} hitSlop={10} onPress={() => goToAndResetTimer(i)}>
              <View
                className={`h-2 rounded-full ${
                  i === index ? 'w-7 bg-blue-spruce-700' : 'w-2 bg-blue-spruce-200'
                }`}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => push('/auth/register' as Href)}
          accessibilityRole="button"
          className="h-12 items-center justify-center rounded-xl bg-blue-spruce-600 active:opacity-90">
          <Text className="font-sans-semibold text-[16px] text-white">{t.welcome.getStarted}</Text>
        </Pressable>

        <Pressable
          onPress={() => push('/auth/login' as Href)}
          accessibilityRole="button"
          className="mt-3 h-12 items-center justify-center rounded-xl border-[1.5px] border-black bg-white active:opacity-90">
          <Text className="font-sans-semibold text-[16px] text-black">{t.auth.logIn}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
