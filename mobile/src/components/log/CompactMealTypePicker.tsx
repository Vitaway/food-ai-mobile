import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { MEAL_TYPE_OPTIONS, type MealTypeId } from '@/constants/mealTypes';

type CompactMealTypePickerProps = {
  selected: MealTypeId | null;
  onSelect: (id: MealTypeId) => void;
};

export function CompactMealTypePicker({ selected, onSelect }: CompactMealTypePickerProps) {
  return (
    <View>
      <Text className="mb-2 font-sans-semibold text-sm text-neutral-700">Meal type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {MEAL_TYPE_OPTIONS.map((option) => {
          const active = selected === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                active ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-200 bg-white'
              }`}>
              <Ionicons name={option.icon} size={16} color={active ? '#023459' : '#4f5346'} />
              <Text className={`font-sans-medium text-sm ${active ? 'text-blue-spruce-800' : 'text-neutral-700'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
