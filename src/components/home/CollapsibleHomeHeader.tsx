import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HealthScoreRing } from '@/components/home/HealthScoreRing';
import { WeekDaySelector } from '@/components/home/WeekDaySelector';
import { Text } from '@/components/ui/Text';
import { CONTENT_SHEET_OVERLAP } from '@/components/ui/GradientHeader';
import { palette } from '@/design-system/colors';

const WEEK_DAY_BAR_HEIGHT = 40;
/** Extra offset below the header/sheet seam. */
const WEEK_DAY_BAR_DOWN_OFFSET = 10;
/** Space below the floating week bar before scroll content (macro pills). */
export const HOME_WEEK_DAY_BAR_CLEARANCE =
  WEEK_DAY_BAR_HEIGHT + WEEK_DAY_BAR_DOWN_OFFSET + 28;

function getCollapseRange(expandedHeight: number, collapsedHeight: number) {
  return expandedHeight - collapsedHeight;
}

export function useHomeSheetPosition(
  scrollY: SharedValue<number>,
  expandedHeight: number,
  collapsedHeight: number,
) {
  const collapseRange = getCollapseRange(expandedHeight, collapsedHeight);

  return useAnimatedStyle(() => ({
    marginTop: interpolate(
      scrollY.value,
      [0, collapseRange],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
  }));
}

export function useHomeHeaderLayout() {
  const insets = useSafeAreaInsets();
  const collapsedHeight = insets.top + 136;
  const expandedHeight = insets.top + 372;

  return { collapsedHeight, expandedHeight, insets };
}

type HomeWeekDayBarProps = {
  scrollY: SharedValue<number>;
  expandedHeight: number;
  collapsedHeight: number;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
};

export function HomeWeekDayBar({
  scrollY,
  expandedHeight,
  collapsedHeight,
  selectedDate,
  onSelectDate,
}: HomeWeekDayBarProps) {
  const collapseRange = getCollapseRange(expandedHeight, collapsedHeight);
  const expandedTop = expandedHeight - CONTENT_SHEET_OVERLAP + WEEK_DAY_BAR_DOWN_OFFSET;
  const collapsedTop = collapsedHeight - CONTENT_SHEET_OVERLAP + WEEK_DAY_BAR_DOWN_OFFSET;

  const containerStyle = useAnimatedStyle(() => ({
    top: interpolate(scrollY.value, [0, collapseRange], [expandedTop, collapsedTop], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: 20,
          right: 20,
          zIndex: 3,
          height: WEEK_DAY_BAR_HEIGHT,
        },
        containerStyle,
      ]}>
      <WeekDaySelector
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        className="mt-0"
        variant="overlay"
      />
    </Animated.View>
  );
}

type CollapsibleHomeHeaderProps = {
  scrollY: SharedValue<number>;
  displayName: string;
  calorieProgress: number;
  isToday: boolean;
  healthScore: number;
  streakDays: number;
  expandedHeight: number;
  collapsedHeight: number;
};

export function CollapsibleHomeHeader({
  scrollY,
  displayName,
  calorieProgress,
  isToday,
  healthScore,
  streakDays,
  expandedHeight,
  collapsedHeight,
}: CollapsibleHomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const collapseRange = getCollapseRange(expandedHeight, collapsedHeight);
  const streakSubtitle = `${streakDays}-day streak`;

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, collapseRange],
      [expandedHeight, collapsedHeight],
      Extrapolation.CLAMP,
    ),
    overflow: 'hidden' as const,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, collapseRange * 0.25], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, collapseRange * 0.3], [72, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, collapseRange * 0.3], [4, 0], Extrapolation.CLAMP),
  }));

  const ringSectionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, collapseRange * 0.58], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, collapseRange], [220, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, collapseRange], [20, 0], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        },
        containerStyle,
      ]}>
      <LinearGradient
        colors={[palette['blue-spruce'][800], palette['blue-spruce'][600], palette['blue-spruce'][400]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-sans-bold text-3xl text-white">Hello, {displayName}</Text>
            <Text className="mt-1 text-sm text-white/80">How do you feel today?</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="notifications-outline" size={18} color="#ffffff" />
            </Pressable>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-shamrock-500">
              <Ionicons name="person-outline" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        <Animated.View style={subtitleStyle}>
          <Text className="text-base text-white/85">
            You&apos;re {calorieProgress}% toward {isToday ? "today's" : 'your'} calorie goal
          </Text>
          <View className="mt-3 flex-row gap-2">
            <View className="rounded-2xl bg-white/15 px-3 py-2">
              <Text className="text-xs text-white/75">Streak</Text>
              <Text className="font-sans-semibold text-sm text-white">{streakSubtitle}</Text>
            </View>
            <View className="rounded-2xl bg-white/15 px-3 py-2">
              <Text className="text-xs text-white/75">Status</Text>
              <Text className="font-sans-semibold text-sm text-white">{isToday ? 'Today plan' : 'History view'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={ringSectionStyle}>
          <HealthScoreRing score={healthScore} subtitle={isToday ? 'Balanced day' : 'Past day snapshot'} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}
