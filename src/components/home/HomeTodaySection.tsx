import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { MealTimeline, type MealTimelineItem } from '@/components/home/MealTimeline';
import { Text } from '@/components/ui/Text';
import type { MealTypeId } from '@/constants/mealTypes';

type HomeTodaySectionProps = {
  title: string;
  loggedCount: number;
  totalSlots: number;
  meals: MealTimelineItem[];
  onMealPress: (mealId: string) => void;
  onAddMeal: (mealTypeId?: MealTypeId) => void;
};

export function HomeTodaySection({
  title,
  loggedCount,
  totalSlots,
  meals,
  onMealPress,
  onAddMeal,
}: HomeTodaySectionProps) {
  const progress = totalSlots > 0 ? Math.min(loggedCount / totalSlots, 1) : 0;
  const size = 52;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
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
          <Text className="font-sans-bold text-2xl text-neutral-900">{title}</Text>
          <Text className="mt-0.5 text-sm text-neutral-500">
            {loggedCount} of {totalSlots} meal slots logged
          </Text>
        </View>

        <View className="items-center justify-center" style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8EAE4" strokeWidth={stroke} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#FF6F32"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <Text className="font-sans-bold text-sm text-neutral-900">
            {loggedCount}/{totalSlots}
          </Text>
        </View>
      </View>

      <MealTimeline
        dateLabel=""
        meals={meals}
        onMealPress={onMealPress}
        onAddMeal={onAddMeal}
      />

      <Pressable
        onPress={() => onAddMeal()}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-ash-grey-300 py-3 active:bg-ash-grey-50">
        <Ionicons name="add-circle-outline" size={20} color="#FF6F32" />
        <Text className="font-sans-semibold text-sm text-cinnamon-wood-500">Add another meal</Text>
      </Pressable>
    </View>
  );
}
