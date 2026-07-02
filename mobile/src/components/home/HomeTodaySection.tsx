import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { MealTimeline, type MealTimelineItem } from '@/components/home/MealTimeline';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { DISPLAY_TITLE_CLASS } from '@/constants/fonts';
import { cn } from '@/utils/cn';

type HomeTodaySectionProps = {
  title: string;
  mealCount: number;
  meals: MealTimelineItem[];
  onMealPress: (mealId: string) => void;
  onAddMeal: () => void;
};

export function HomeTodaySection({
  title,
  mealCount,
  meals,
  onMealPress,
  onAddMeal,
}: HomeTodaySectionProps) {
  const size = 52;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = mealCount > 0 ? 1 : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      className="mb-4 rounded-3xl bg-white p-5"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      }}>
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className={cn('text-2xl text-neutral-900', DISPLAY_TITLE_CLASS)}>{title}</Text>
          <Text className="mt-0.5 text-sm text-neutral-500">
            {mealCount === 0 ? 'No meals logged yet' : `${mealCount} meal${mealCount === 1 ? '' : 's'} logged`}
          </Text>
        </View>

        <View className="items-center justify-center" style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8EAE4" strokeWidth={stroke} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={semanticColors.accentOrange}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <Text className="font-sans-bold text-sm text-neutral-900">{mealCount}</Text>
        </View>
      </View>

      {meals.length > 0 ? (
        <MealTimeline dateLabel="" meals={meals} onMealPress={onMealPress} />
      ) : (
        <View className="rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-4 py-8">
          <Text className="text-center font-sans-semibold text-neutral-700">Nothing logged yet</Text>
          <Text className="mt-1 text-center text-sm text-neutral-500">
            Log breakfast, snacks, or any meal whenever you eat.
          </Text>
        </View>
      )}

      <Pressable
        onPress={onAddMeal}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-ash-grey-300 py-3 active:bg-ash-grey-50">
        <Ionicons name="add-circle-outline" size={20} color={semanticColors.accentOrange} />
        <Text className="font-sans-semibold text-sm text-cinnamon-wood-400">Log another meal</Text>
      </Pressable>
    </View>
  );
}
