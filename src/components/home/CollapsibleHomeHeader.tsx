import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
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
  const collapsedHeight = insets.top + 128;
  const expandedHeight = insets.top + 356;

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
    maxHeight: interpolate(scrollY.value, [0, collapseRange * 0.3], [28, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, collapseRange * 0.3], [4, 0], Extrapolation.CLAMP),
  }));

  const ringSectionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, collapseRange * 0.55], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, collapseRange], [252, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, collapseRange], [24, 0], Extrapolation.CLAMP),
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
        colors={[palette['blue-spruce'][700], palette['blue-spruce'][500], palette['blue-spruce'][400]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <Text className="font-sans-bold text-3xl text-white">Hello {displayName}</Text>

        <Animated.View style={subtitleStyle}>
          <Text className="text-base text-white/85">
            You&apos;re {calorieProgress}% toward {isToday ? "today's" : 'your'} calorie goal
          </Text>
        </Animated.View>

        <Animated.View style={ringSectionStyle}>
          <HealthScoreRing score={healthScore} subtitle={`${streakDays}-day streak`} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}
