import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { fetchCoachingFeed, type CoachingFeedItem } from '@/services/remote/consumerApi';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useProfile } from '@/context/ProfileContext';

const CARD_WIDTH = 168;
const CARD_GAP = 10;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const RESUME_IDLE_MS = 2800;

const TYPE_LABEL: Record<CoachingFeedItem['type'], string> = {
  tip: 'Tip',
  celebration: 'Win',
  reminder: 'Reminder',
  coach_note: 'Coach',
  trend: 'Insight',
};

const TYPE_STYLES: Record<
  CoachingFeedItem['type'],
  { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }
> = {
  tip: { icon: 'bulb-outline', bg: 'bg-blue-spruce-50', color: '#023459' },
  celebration: { icon: 'trophy-outline', bg: 'bg-shamrock-50', color: '#1D9E75' },
  reminder: { icon: 'notifications-outline', bg: 'bg-cinnamon-wood-50', color: '#C45A11' },
  coach_note: { icon: 'chatbubble-ellipses-outline', bg: 'bg-blue-spruce-50', color: '#023459' },
  trend: { icon: 'trending-up-outline', bg: 'bg-shamrock-50', color: '#1D9E75' },
};

function TipCard({
  item,
  onPress,
}: {
  item: CoachingFeedItem;
  onPress: (item: CoachingFeedItem) => void;
}) {
  const style = TYPE_STYLES[item.type];
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
      className={`rounded-2xl border border-ash-grey-100 p-3 ${style.bg} active:opacity-90`}>
      <View className="mb-2 flex-row items-center gap-1.5">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/80">
          <Ionicons name={style.icon} size={14} color={style.color} />
        </View>
        <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-neutral-500">
          {TYPE_LABEL[item.type]}
        </Text>
      </View>
      <Text className="font-sans-semibold text-[13px] text-neutral-900" numberOfLines={2}>
        {item.title}
      </Text>
      <Text className="mt-1 text-xs leading-4 text-neutral-600" numberOfLines={3}>
        {item.body}
      </Text>
    </Pressable>
  );
}

export function CoachingFeedCard() {
  const { push } = useNavigateOnce();
  const { profile } = useProfile();
  const [data, setData] = useState<CoachingFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CoachingFeedItem | null>(null);
  const [paused, setPaused] = useState(false);

  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const loopWidthSV = useSharedValue(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);
      void fetchCoachingFeed()
        .then((items) => {
          if (active) setData(items);
        })
        .catch(() => {
          if (active) setData([]);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }, [profile?.macroTargets?.proteinG, profile?.waterTargetMl, profile?.updatedAt]),
  );

  const loopItems = useMemo(() => {
    if (!data.length) return [];
    const copies = data.length === 1 ? 8 : data.length <= 3 ? 4 : 3;
    return Array.from({ length: copies }, () => data).flat();
  }, [data]);

  const loopWidth = Math.max(0, data.length * CARD_STEP);

  useEffect(() => {
    loopWidthSV.value = loopWidth;
  }, [loopWidth, loopWidthSV]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const startMarquee = useCallback(() => {
    if (loopWidth <= 0) return;
    cancelAnimation(translateX);

    // Normalize into (-loopWidth, 0]
    let current = translateX.value % loopWidth;
    if (current > 0) current -= loopWidth;
    if (current === 0) current = 0;
    translateX.value = current;

    const fullDuration = Math.max(14_000, data.length * 4000);
    const traveled = -current;
    const remaining = loopWidth - traveled;
    const firstDuration = Math.max(400, (remaining / loopWidth) * fullDuration);

    translateX.value = withTiming(
      -loopWidth,
      { duration: firstDuration, easing: Easing.linear },
      (finished) => {
        if (!finished) return;
        translateX.value = 0;
        translateX.value = withRepeat(
          withTiming(-loopWidth, { duration: fullDuration, easing: Easing.linear }),
          -1,
          false,
        );
      },
    );
  }, [data.length, loopWidth, translateX]);

  const pauseMarquee = useCallback(() => {
    cancelAnimation(translateX);
    clearResumeTimer();
    setPaused(true);
  }, [clearResumeTimer, translateX]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      setPaused(false);
    }, RESUME_IDLE_MS);
  }, [clearResumeTimer]);

  // Auto-scroll by default whenever we have cards and aren't paused/expanded
  useEffect(() => {
    if (!data.length || paused || selected || loopWidth <= 0) {
      cancelAnimation(translateX);
      return;
    }
    // Small delay so layout settles before first move
    const boot = setTimeout(() => startMarquee(), 80);
    return () => {
      clearTimeout(boot);
      cancelAnimation(translateX);
    };
  }, [data.length, loopWidth, paused, selected, startMarquee, translateX]);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      cancelAnimation(translateX);
      dragStartX.value = translateX.value;
      runOnJS(pauseMarquee)();
    })
    .onUpdate((e) => {
      const width = loopWidthSV.value;
      if (width <= 0) {
        translateX.value = dragStartX.value + e.translationX;
        return;
      }
      let next = (dragStartX.value + e.translationX) % width;
      if (next > 0) next -= width;
      translateX.value = next;
    })
    .onFinalize(() => {
      runOnJS(scheduleResume)();
    });

  const marqueeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (isLoading) {
    return (
      <View className="rounded-3xl bg-white px-4 py-4">
        <Text className="font-sans-semibold text-base text-neutral-900">Tips & insights</Text>
        <Text className="mt-2 text-sm text-neutral-500">Loading personalized tips…</Text>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View className="rounded-3xl bg-white px-4 py-4">
        <Text className="font-sans-semibold text-base text-neutral-900">Tips & insights</Text>
        <Text className="mt-2 text-sm leading-5 text-neutral-500">
          Your coach is personalizing your plan. Tips and reminders will show up here as you log
          meals.
        </Text>
      </View>
    );
  }

  const selectedStyle = selected ? TYPE_STYLES[selected.type] : null;

  return (
    <View className="overflow-hidden rounded-3xl bg-white py-4">
      <View className="mb-3 px-4">
        <Text className="font-sans-semibold text-base text-neutral-900">Tips & insights</Text>
        <Text className="mt-0.5 text-sm text-neutral-500">
          {paused ? 'Swipe freely · resumes shortly' : 'Auto-scrolling · drag to browse'}
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flexDirection: 'row', paddingLeft: 16 }, marqueeStyle]}>
          {loopItems.map((item, index) => (
            <TipCard
              key={`${item.id}-${index}`}
              item={item}
              onPress={(tip) => {
                pauseMarquee();
                setSelected(tip);
              }}
            />
          ))}
        </Animated.View>
      </GestureDetector>

      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelected(null);
          scheduleResume();
        }}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-5"
          onPress={() => {
            setSelected(null);
            scheduleResume();
          }}>
          {selected && selectedStyle ? (
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border border-ash-grey-100 p-5 ${selectedStyle.bg}`}>
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/80">
                    <Ionicons name={selectedStyle.icon} size={20} color={selectedStyle.color} />
                  </View>
                  <Text className="text-xs font-sans-semibold uppercase tracking-wide text-neutral-500">
                    {TYPE_LABEL[selected.type]}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setSelected(null);
                    scheduleResume();
                  }}
                  hitSlop={12}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/80">
                  <Ionicons name="close" size={18} color="#6B7280" />
                </Pressable>
              </View>

              <Text className="font-sans-semibold text-xl text-neutral-900">{selected.title}</Text>
              <Text className="mt-3 text-base leading-6 text-neutral-700">{selected.body}</Text>

              {selected.actionLabel && selected.actionRoute ? (
                <Pressable
                  onPress={() => {
                    const route = selected.actionRoute;
                    setSelected(null);
                    if (route) push(route as never);
                  }}
                  className="mt-5 items-center rounded-2xl bg-blue-spruce-700 px-4 py-3 active:opacity-90">
                  <Text className="font-sans-semibold text-white">{selected.actionLabel}</Text>
                </Pressable>
              ) : null}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
