import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  MEAL_TYPE_GROUPS,
  MEAL_TYPE_OPTIONS,
  type MealTypeId,
  type MealTypeOption,
} from '@/constants/mealTypes';

type MealTypePickerProps = {
  selected: MealTypeId | null;
  disabled?: boolean;
  onSelect: (id: MealTypeId | null) => void;
};

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function MealTypeCard({
  option,
  selected,
  disabled,
  onPress,
}: {
  option: MealTypeOption;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ width: '100%' }}
      className={`relative rounded-2xl border-2 px-3 py-3 active:opacity-90 ${
        selected ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-100 bg-ash-grey-50'
      }`}>
      {selected ? (
        <View className="absolute right-2 top-2 z-10 h-5 w-5 items-center justify-center rounded-full bg-blue-spruce-600">
          <Ionicons name="checkmark" size={12} color="#ffffff" />
        </View>
      ) : null}

      <View
        className={`mb-2 h-9 w-9 items-center justify-center rounded-xl ${
          selected ? 'bg-blue-spruce-100' : 'bg-white'
        }`}>
        <Ionicons name={option.icon} size={20} color={selected ? '#023459' : '#4f5346'} />
      </View>

      <Text className="font-sans-semibold text-sm text-neutral-900" numberOfLines={1}>
        {option.label}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500" numberOfLines={1}>
        {option.timeHint}
      </Text>
    </Pressable>
  );
}

function handleMealTypePress(
  optionId: MealTypeId,
  selected: MealTypeId | null,
  onSelect: (id: MealTypeId | null) => void,
) {
  onSelect(selected === optionId ? null : optionId);
}

function MealTypeRow({
  options,
  selected,
  disabled,
  onSelect,
}: {
  options: MealTypeOption[];
  selected: MealTypeId | null;
  disabled?: boolean;
  onSelect: (id: MealTypeId | null) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => (
        <View key={option.id} style={{ flex: 1 }}>
          <MealTypeCard
            option={option}
            selected={selected === option.id}
            disabled={disabled}
            onPress={() => handleMealTypePress(option.id, selected, onSelect)}
          />
        </View>
      ))}
      {options.length === 1 ? <View style={{ flex: 1 }} /> : null}
    </View>
  );
}

function MealTypeGrid({
  options,
  selected,
  disabled,
  onSelect,
}: {
  options: MealTypeOption[];
  selected: MealTypeId | null;
  disabled?: boolean;
  onSelect: (id: MealTypeId | null) => void;
}) {
  return (
    <View className="gap-2">
      {chunkPairs(options).map((row, index) => (
        <MealTypeRow
          key={row.map((o) => o.id).join('-') || `row-${index}`}
          options={row}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

export function MealTypePicker({ selected, disabled, onSelect }: MealTypePickerProps) {
  return (
    <View className="gap-4">
      {MEAL_TYPE_GROUPS.map((group) => {
        const options = MEAL_TYPE_OPTIONS.filter((o) => o.group === group.key);

        return (
          <View key={group.key}>
            <Text className="mb-2 font-sans-semibold text-xs uppercase tracking-wide text-neutral-500">
              {group.title}
            </Text>
            {group.key === 'main' ? (
              <View className="flex-row gap-2">
                {options.map((option) => (
                  <View key={option.id} style={{ flex: 1 }}>
                    <MealTypeCard
                      option={option}
                      selected={selected === option.id}
                      disabled={disabled}
                      onPress={() => handleMealTypePress(option.id, selected, onSelect)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <MealTypeGrid options={options} selected={selected} disabled={disabled} onSelect={onSelect} />
            )}
          </View>
        );
      })}
    </View>
  );
}
