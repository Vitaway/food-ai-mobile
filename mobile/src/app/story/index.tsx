import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Pressable,
  Share,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StoryPlateArt } from '@/components/story/StoryPlateArt';
import { Text } from '@/components/ui/Text';
import { useI18n, tf } from '@/context/LocaleContext';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import { fonts } from '@/constants/fonts';
import { palette } from '@/design-system/colors';
import {
  buildWeeklyStory,
  weeklyStoryShareText,
  type StoryPlateItem,
  type WeeklyStory,
} from '@/utils/weeklyStory';

const { width: SCREEN_W } = Dimensions.get('window');
const AUTO_MS = 5200;

type SlideKind = 'meals' | 'loved' | 'protein' | 'plate' | 'tip' | 'empty';

type SlideModel = {
  id: SlideKind;
  colors: [string, string];
  labColor: string;
  ink: string;
  muted: string;
  eyebrow: string;
  headline: string;
  body: string;
  huge?: string;
  plateItems?: StoryPlateItem[];
  proteinBars?: { prior: number; current: number; max: number };
  showShare?: boolean;
};

function buildSlides(story: WeeklyStory, t: ReturnType<typeof useI18n>['t']): SlideModel[] {
  if (!story.hasData) {
    return [
      {
        id: 'empty',
        colors: [palette['blue-spruce'][800], palette['blue-spruce'][950]],
        labColor: palette['ash-grey'][200],
        ink: '#ffffff',
        muted: 'rgba(255,255,255,0.72)',
        eyebrow: `${t.home.weekInFood} · ${story.rangeLabel}`,
        headline: t.story.emptyTitle,
        body: t.story.emptyBody,
      },
    ];
  }

  const tip =
    story.tipKind === 'protein'
      ? { title: t.story.tipProteinTitle, body: t.story.tipProteinBody }
      : story.tipKind === 'fibre'
        ? { title: t.story.tipFibreTitle, body: t.story.tipFibreBody }
        : { title: t.story.tipIronTitle, body: t.story.tipIronBody };

  const everyDay = story.activeDays >= story.windowDays;
  const mealsHeadline = everyDay
    ? tf(t.story.mealsHeadlineEveryDay, { n: story.mealsLogged })
    : tf(t.story.mealsHeadline, { n: story.mealsLogged });
  const mealsBody = everyDay
    ? tf(t.story.mealsBodyStreak, { days: story.activeDays })
    : tf(t.story.mealsBody, { days: story.activeDays, window: story.windowDays });

  const proteinHeadline =
    story.proteinDeltaPct != null && Math.abs(story.proteinDeltaPct) >= 3
      ? story.proteinDeltaPct > 0
        ? tf(t.story.proteinHeadlineUp, {
            pct: Math.abs(story.proteinDeltaPct),
            g: Math.round(story.avgProteinPerDayG),
          })
        : tf(t.story.proteinHeadlineDown, {
            pct: Math.abs(story.proteinDeltaPct),
            g: Math.round(story.avgProteinPerDayG),
          })
      : tf(t.story.proteinHeadlineFlat, { g: Math.round(story.avgProteinPerDayG) });

  const barMax = Math.max(
    story.avgProteinPriorPerDayG,
    story.avgProteinPerDayG,
    1,
  ) * 1.12;

  return [
    {
      id: 'meals',
      colors: [palette['blue-spruce'][700], palette['blue-spruce'][950]],
      labColor: '#C5D4A8',
      ink: '#ffffff',
      muted: 'rgba(255,255,255,0.78)',
      eyebrow: `${t.home.weekInFood} · ${story.rangeLabel}`,
      huge: String(story.mealsLogged),
      headline: mealsHeadline,
      body: mealsBody,
    },
    {
      id: 'loved',
      colors: [palette['ash-grey'][100], palette['ash-grey'][300]],
      labColor: palette['blue-spruce'][700],
      ink: palette['blue-spruce'][900],
      muted: palette['blue-spruce'][600],
      eyebrow: t.story.favourite,
      headline: story.mostLovedFood
        ? tf(t.story.lovedHeadline, {
            food: story.mostLovedFood,
            n: story.mostLovedCount,
            days: story.windowDays,
          })
        : t.story.lovedFallbackTitle,
      body: story.mostLovedFood ? t.story.lovedBodySteady : t.story.lovedFallbackBody,
      plateItems: story.mostLovedPlateItems,
    },
    {
      id: 'protein',
      colors: [palette.shamrock[600], palette.shamrock[900]],
      labColor: '#CFF3E4',
      ink: '#ffffff',
      muted: 'rgba(225,247,238,0.9)',
      eyebrow: t.story.protein,
      headline: proteinHeadline,
      body:
        story.proteinDeltaG > 2
          ? tf(t.story.proteinUpBody, { n: Math.abs(Math.round(story.proteinDeltaG)) })
          : story.proteinDeltaG < -2
            ? tf(t.story.proteinDownBody, { n: Math.abs(Math.round(story.proteinDeltaG)) })
            : t.story.proteinFlatBody,
      proteinBars: {
        prior: story.avgProteinPriorPerDayG,
        current: story.avgProteinPerDayG,
        max: barMax,
      },
    },
    {
      id: 'plate',
      colors: [palette['blue-spruce'][800], '#050a07'],
      labColor: '#C5D4A8',
      ink: '#ffffff',
      muted: 'rgba(255,255,255,0.78)',
      eyebrow: t.story.plate,
      headline:
        story.bestPlateScore != null
          ? tf(t.story.plateHeadline, {
              score: story.bestPlateScore,
              meal: story.bestPlateMealName ?? t.story.aMeal,
            })
          : t.story.plateFallbackTitle,
      body:
        story.bestPlateScore != null
          ? tf(t.story.plateBody, { meal: story.bestPlateMealName ?? t.story.aMeal })
          : t.story.plateFallbackBody,
      plateItems: story.bestPlateItems,
    },
    {
      id: 'tip',
      colors: [palette['cinnamon-wood'][400], palette['cinnamon-wood'][700]],
      labColor: palette['blue-spruce'][900],
      ink: palette['blue-spruce'][950],
      muted: 'rgba(10,18,12,0.72)',
      eyebrow: t.story.nextWeek,
      headline: tip.title,
      body: tip.body,
      showShare: true,
    },
  ];
}

function ProgressBars({
  count,
  index,
  progress,
  dark,
}: {
  count: number;
  index: number;
  progress: Animated.Value;
  dark: boolean;
}) {
  const track = dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.28)';
  const fill = dark ? palette['blue-spruce'][900] : '#ffffff';

  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className="h-[3px] flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: track }}>
          {i < index ? (
            <View className="h-full w-full" style={{ backgroundColor: fill }} />
          ) : i === index ? (
            <Animated.View
              className="h-full"
              style={{
                backgroundColor: fill,
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ProteinBars({
  prior,
  current,
  max,
  ink,
  muted,
  priorLabel,
  currentLabel,
}: {
  prior: number;
  current: number;
  max: number;
  ink: string;
  muted: string;
  priorLabel: string;
  currentLabel: string;
}) {
  return (
    <View className="mt-6 gap-3.5">
      <View>
        <Text style={{ color: muted, fontSize: 12, fontFamily: fonts.sansBold, marginBottom: 6 }}>
          {priorLabel} · {Math.round(prior)} g
        </Text>
        <View
          className="h-4 overflow-hidden rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.28)', width: '100%' }}>
          <View
            className="h-full rounded-lg"
            style={{
              width: `${Math.min(100, (prior / max) * 100)}%`,
              backgroundColor: 'rgba(255,255,255,0.45)',
            }}
          />
        </View>
      </View>
      <View>
        <Text style={{ color: ink, fontSize: 12, fontFamily: fonts.sansBold, marginBottom: 6 }}>
          {currentLabel} · {Math.round(current)} g
        </Text>
        <View
          className="h-4 overflow-hidden rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.28)', width: '100%' }}>
          <View
            className="h-full rounded-lg bg-white"
            style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
          />
        </View>
      </View>
    </View>
  );
}

export default function StoryScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const story = useMemo(
    () =>
      buildWeeklyStory(meals, {
        proteinTargetG: profile?.macroTargets?.proteinG,
        fibreTargetG: profile?.macroTargets?.fiberG,
      }),
    [meals, profile?.macroTargets?.fiberG, profile?.macroTargets?.proteinG],
  );

  const slides = useMemo(() => buildSlides(story, t), [story, t]);
  const slide = slides[index] ?? slides[0];
  const isLast = index >= slides.length - 1;
  const darkChrome = slide.id === 'loved' || slide.id === 'tip';

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [slides.length],
  );

  const handleShare = useCallback(async () => {
    const message = weeklyStoryShareText(story, {
      title: t.story.shareTitle,
      mealsLine: t.story.shareMeals,
      lovedLine: t.story.shareLoved,
      proteinUp: t.story.shareProteinUp,
      proteinDown: t.story.shareProteinDown,
      proteinFlat: t.story.shareProteinFlat,
      plateLine: t.story.sharePlate,
      tipProtein: t.story.tipProteinBody,
      tipFibre: t.story.tipFibreBody,
      tipIron: t.story.tipIronBody,
      empty: t.story.emptyBody,
      brand: t.story.shareBrand,
    });
    try {
      await Share.share({ message });
    } catch {
      toast.error(t.common.tryAgain);
    }
  }, [story, t, toast]);

  useEffect(() => {
    animRef.current?.stop();
    progress.setValue(0);
    if (reduceMotion || isLast || slides.length <= 1) return;

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: AUTO_MS,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) goTo(index + 1);
    });
    return () => anim.stop();
  }, [goTo, index, isLast, progress, reduceMotion, slides.length]);

  const onTap = useCallback(
    (side: 'left' | 'right') => {
      if (side === 'left') {
        if (index > 0) goTo(index - 1);
        return;
      }
      if (isLast) return;
      goTo(index + 1);
    },
    [goTo, index, isLast],
  );

  return (
    <View style={{ flex: 1, backgroundColor: slide.colors[1] }}>
      <LinearGradient
        colors={slide.colors}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top + 10 }}>
        <View className="px-4">
          <View className="mb-3 flex-row items-center gap-3">
            <View className="min-w-0 flex-1">
              <ProgressBars
                count={slides.length}
                index={index}
                progress={progress}
                dark={darkChrome}
              />
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel={t.common.close}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: darkChrome ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)' }}>
              <Ionicons name="close" size={18} color={darkChrome ? palette['blue-spruce'][900] : '#fff'} />
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: 22,
              paddingBottom: Math.max(insets.bottom, 18) + (slide.showShare ? 88 : 28),
              justifyContent:
                slide.id === 'loved' || slide.id === 'plate' ? 'center' : 'flex-end',
            }}>
            <Text
              style={{
                color: slide.labColor,
                fontSize: 12,
                fontFamily: fonts.sansExtraBold,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
              {slide.eyebrow}
            </Text>

            {slide.huge ? (
              <Text
                style={{
                  color: slide.ink,
                  fontSize: Math.min(118, SCREEN_W * 0.28),
                  lineHeight: Math.min(118, SCREEN_W * 0.28) * 0.92,
                  fontFamily: fonts.sansExtraBold,
                  letterSpacing: -3,
                  marginBottom: 8,
                }}>
                {slide.huge}
              </Text>
            ) : null}

            {(slide.id === 'loved' || slide.id === 'plate') && (slide.plateItems?.length ?? 0) > 0 ? (
              <View className="mb-6 items-center">
                <StoryPlateArt
                  items={slide.plateItems ?? []}
                  size={Math.min(240, SCREEN_W * 0.58)}
                  ink={slide.ink}
                  rim={darkChrome ? 'rgba(26,58,42,0.18)' : 'rgba(255,255,255,0.28)'}
                />
              </View>
            ) : null}

            <Text
              style={{
                color: slide.ink,
                fontSize: slide.huge ? 28 : 34,
                lineHeight: slide.huge ? 34 : 40,
                fontFamily: fonts.sansExtraBold,
                letterSpacing: -0.8,
              }}>
              {slide.headline}
            </Text>

            {slide.proteinBars ? (
              <ProteinBars
                prior={slide.proteinBars.prior}
                current={slide.proteinBars.current}
                max={slide.proteinBars.max}
                ink={slide.ink}
                muted={slide.muted}
                priorLabel={t.story.lastWeek}
                currentLabel={t.story.thisWeekShort}
              />
            ) : null}

            <Text
              style={{
                color: slide.muted,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: fonts.sansMedium,
                marginTop: 12,
                maxWidth: 360,
              }}>
              {slide.body}
            </Text>

            {slide.showShare ? (
              <View className="mt-7 flex-row gap-3">
                <Pressable
                  onPress={() => void handleShare()}
                  className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full"
                  style={{ backgroundColor: palette['blue-spruce'][900] }}>
                  <Ionicons name="share-outline" size={18} color="#ffffff" />
                  <Text className="font-sans-bold text-[15px] text-white">{t.story.share}</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.back()}
                  className="h-14 flex-1 items-center justify-center rounded-full bg-white">
                  <Text
                    className="font-sans-bold text-[15px]"
                    style={{ color: palette['blue-spruce'][900] }}>
                    {t.common.done}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!isLast && !slide.showShare ? (
              <Text
                style={{
                  color: slide.muted,
                  fontSize: 12,
                  fontFamily: fonts.sansBold,
                  opacity: 0.75,
                  textAlign: 'center',
                  marginTop: 22,
                }}>
                {t.story.tapToContinue}
              </Text>
            ) : null}
          </View>

          {/* Tap zones — Instagram-style */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: slide.showShare ? 120 : 0,
              flexDirection: 'row',
            }}>
            <Pressable style={{ flex: 1 }} onPress={() => onTap('left')} accessibilityLabel={t.story.back} />
            <Pressable style={{ flex: 1 }} onPress={() => onTap('right')} accessibilityLabel={t.story.next} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
