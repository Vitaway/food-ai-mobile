import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  MEAL_TYPE_GROUPS,
  MEAL_TYPE_OPTIONS,
  type MealTypeId,
  type MealTypeOption,
} from '@/constants/mealTypes';
import { palette } from '@/design-system/colors';

type MealTypePickerProps = {
  selected: MealTypeId | null;
  disabled?: boolean;
  onSelect: (id: MealTypeId | null) => void;
};

function MealTypeChip({
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
  const accent = palette['blue-spruce'];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-90"
      style={{
        borderColor: selected ? accent[500] : palette['ash-grey'][200],
        backgroundColor: selected ? accent[50] : '#ffffff',
        opacity: disabled ? 0.55 : 1,
      }}>
      <Ionicons
        name={option.icon}
        size={15}
        color={selected ? accent[700] : palette['ash-grey'][600]}
      />
      <Text
        className={`text-[13px] ${selected ? 'font-sans-bold text-blue-spruce-900' : 'font-sans-semibold text-neutral-800'}`}
        numberOfLines={1}>
        {option.label}
      </Text>
    </Pressable>
  );
}

export function MealTypePicker({ selected, disabled, onSelect }: MealTypePickerProps) {
  return (
    <View className="gap-3">
      {MEAL_TYPE_GROUPS.map((group) => {
        const options = MEAL_TYPE_OPTIONS.filter((o) => o.group === group.key);

        return (
          <View key={group.key}>
            <Text className="mb-1.5 text-[10px] font-sans-bold uppercase tracking-wide text-ash-grey-400">
              {group.title}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {options.map((option) => (
                <MealTypeChip
                  key={option.id}
                  option={option}
                  selected={selected === option.id}
                  disabled={disabled}
                  onPress={() => onSelect(selected === option.id ? null : option.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
