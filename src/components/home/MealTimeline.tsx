import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

export type MealTimelineItem = {
  id: string;
  label: string;
  time?: string;
  items?: string[];
  logged: boolean;
  calories?: number;
};

type MealTimelineProps = {
  dateLabel: string;
  summary?: string;
  meals: MealTimelineItem[];
};

export function MealTimeline({ dateLabel, summary, meals }: MealTimelineProps) {
  return (
    <View className="pb-4">
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-sans-bold text-xl text-neutral-900">{dateLabel}</Text>
          {summary ? <Text className="mt-1 text-sm text-neutral-500">{summary}</Text> : null}
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-ash-grey-100">
          <Ionicons name="calendar-outline" size={20} color="#4f5346" />
        </Pressable>
      </View>

      <View className="relative">
        <View className="absolute bottom-4 left-[18px] top-4 w-px bg-ash-grey-200" />

        {meals.map((meal, index) => (
          <View key={meal.id} className={`flex-row gap-4 ${index < meals.length - 1 ? 'mb-5' : ''}`}>
            <View className="w-9 items-center pt-1">
              <View className={`h-2.5 w-2.5 rounded-full ${meal.logged ? 'bg-blue-spruce-500' : 'bg-ash-grey-300'}`} />
            </View>

            <View className="min-h-[72px] flex-1 flex-row items-start justify-between rounded-2xl bg-ash-grey-50 px-4 py-3">
              <View className="flex-1 pr-3">
                <Text className="font-sans-semibold text-base text-neutral-900">{meal.label}</Text>
                {meal.items?.length ? (
                  <Text className="mt-1 text-sm leading-5 text-neutral-500">{meal.items.join(', ')}</Text>
                ) : null}
                {meal.calories ? (
                  <Text className="mt-1 text-xs font-sans-medium text-blue-spruce-700">{meal.calories} kcal</Text>
                ) : null}
              </View>

              <View className="items-end gap-2">
                {meal.time ? <Text className="text-xs text-neutral-400">{meal.time}</Text> : null}
                {meal.logged ? (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-900">
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                ) : (
                  <Pressable className="h-8 w-8 items-center justify-center rounded-full border border-dashed border-ash-grey-400 bg-white">
                    <Ionicons name="add" size={18} color="#848a75" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
