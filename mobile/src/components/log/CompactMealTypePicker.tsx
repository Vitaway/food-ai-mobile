import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  MEAL_TYPE_GROUPS,
  MEAL_TYPE_OPTIONS,
  type MealTypeId,
  type MealTypeOption,
} from '@/constants/mealTypes';

type CompactMealTypePickerProps = {
  selected: MealTypeId | null;
  onSelect: (id: MealTypeId) => void;
};

function MealTypeMiniCard({
  option,
  selected,
  onPress,
}: {
  option: MealTypeOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-[88px] flex-1 rounded-2xl border-2 px-3 py-3 active:opacity-90 ${
        selected ? 'border-cinnamon-wood-400 bg-cinnamon-wood-50' : 'border-ash-grey-200 bg-white'
      }`}>
      <View
        className={`mb-2 h-8 w-8 items-center justify-center rounded-xl ${
          selected ? 'bg-cinnamon-wood-100' : 'bg-ash-grey-50'
        }`}>
        <Ionicons
          name={option.icon}
          size={18}
          color={selected ? '#ff6f32' : '#4f5346'}
        />
      </View>
      <Text
        className={`font-sans-semibold text-sm ${selected ? 'text-cinnamon-wood-800' : 'text-neutral-900'}`}
        numberOfLines={2}>
        {option.label}
      </Text>
      <Text className="mt-0.5 text-[11px] text-neutral-500" numberOfLines={1}>
        {option.timeHint}
      </Text>
    </Pressable>
  );
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export function CompactMealTypePicker({ selected, onSelect }: CompactMealTypePickerProps) {
  return (
    <View>
      <Text className="mb-3 font-sans-semibold text-sm text-neutral-700">Meal type</Text>
      <View className="gap-4">
        {MEAL_TYPE_GROUPS.map((group) => {
          const options = MEAL_TYPE_OPTIONS.filter((option) => option.group === group.key);
          return (
            <View key={group.key}>
              <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-wide text-neutral-500">
                {group.title}
              </Text>
              <View className="gap-2">
                {chunkPairs(options).map((row) => (
                  <View key={row.map((o) => o.id).join('-')} className="flex-row gap-2">
                    {row.map((option) => (
                      <MealTypeMiniCard
                        key={option.id}
                        option={option}
                        selected={selected === option.id}
                        onPress={() => onSelect(option.id)}
                      />
                    ))}
                    {row.length === 1 ? <View className="flex-1" /> : null}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
