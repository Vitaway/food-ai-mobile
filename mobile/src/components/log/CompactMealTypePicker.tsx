import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  MEAL_TYPE_GROUPS,
  MEAL_TYPE_OPTIONS,
  type MealTypeId,
  type MealTypeOption,
} from '@/constants/mealTypes';
import { useI18n } from '@/context/LocaleContext';
import { palette } from '@/design-system/colors';

type CompactMealTypePickerProps = {
  selected: MealTypeId | null;
  onSelect: (id: MealTypeId) => void;
};

function MealTypeChip({
  option,
  label,
  selected,
  onPress,
}: {
  option: MealTypeOption;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = palette['cinnamon-wood'];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-90"
      style={{
        borderColor: selected ? accent[400] : palette['ash-grey'][200],
        backgroundColor: selected ? accent[50] : '#ffffff',
      }}>
      <Ionicons
        name={option.icon}
        size={15}
        color={selected ? accent[500] : palette['ash-grey'][600]}
      />
      <Text
        className={`text-[13px] ${selected ? 'font-sans-bold text-cinnamon-wood-800' : 'font-sans-semibold text-neutral-800'}`}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CompactMealTypePicker({ selected, onSelect }: CompactMealTypePickerProps) {
  const { t } = useI18n();

  const groupTitle = (key: string) => {
    if (key === 'main') return t.log.groupMain;
    if (key === 'snack') return t.log.groupSnacks;
    return t.log.groupWorkout;
  };

  const optionLabel = (id: MealTypeId) => {
    const map: Partial<Record<MealTypeId, string>> = {
      breakfast: t.log.breakfast,
      lunch: t.log.lunch,
      dinner: t.log.dinner,
      mid_morning_snack: t.log.midMorning,
      afternoon_snack: t.log.afternoon,
      evening_snack: t.log.evening,
      pre_workout: t.log.preWorkout,
      post_workout: t.log.postWorkout,
    };
    return map[id] ?? id;
  };

  return (
    <View>
      <Text className="mb-2.5 font-sans-semibold text-sm text-neutral-800">{t.log.mealType}</Text>
      <View className="gap-3">
        {MEAL_TYPE_GROUPS.map((group) => {
          const options = MEAL_TYPE_OPTIONS.filter((option) => option.group === group.key);
          return (
            <View key={group.key}>
              <Text className="mb-1.5 text-[10px] font-sans-bold uppercase tracking-wide text-ash-grey-400">
                {groupTitle(group.key)}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {options.map((option) => (
                  <MealTypeChip
                    key={option.id}
                    option={option}
                    label={optionLabel(option.id)}
                    selected={selected === option.id}
                    onPress={() => onSelect(option.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
