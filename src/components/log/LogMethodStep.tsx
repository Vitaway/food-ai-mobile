import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { PillOption } from '@/components/ui/PillOption';
import { Text } from '@/components/ui/Text';
import { MEAL_TYPES, type MealTypeId } from '@/constants/mealTypes';

const INPUT_METHODS = [
  { id: 'camera', label: 'Add food via photo', icon: 'camera-outline' as const },
  { id: 'gallery', label: 'Import from gallery', icon: 'images-outline' as const },
  { id: 'text', label: 'Text only', icon: 'text-outline' as const },
  { id: 'past', label: 'From past meals', icon: 'time-outline' as const },
];

type LogMethodStepProps = {
  selectedMethod: string;
  selectedMealType: MealTypeId;
  onSelectMethod: (id: string) => void;
  onSelectMealType: (id: MealTypeId) => void;
  onContinue: () => void;
};

export function LogMethodStep({
  selectedMethod,
  selectedMealType,
  onSelectMethod,
  onSelectMealType,
  onContinue,
}: LogMethodStepProps) {
  return (
    <>
      <Text className="font-sans-bold text-3xl text-white">Log your meal</Text>
      <Text className="mt-2 text-base leading-6 text-white/85">Select a method to capture your meal.</Text>

      <View className="mt-10 gap-3">
        {INPUT_METHODS.map((method) => (
          <PillOption
            key={method.id}
            label={method.label}
            icon={method.icon}
            selected={selectedMethod === method.id}
            onPress={() => onSelectMethod(method.id)}
          />
        ))}
      </View>

      <View className="mt-10">
        <Text className="mb-3 font-sans-semibold text-lg text-white">Meal type</Text>
        <View className="flex-row flex-wrap gap-2">
          {MEAL_TYPES.slice(0, 6).map((mealType) => {
            const isSelected = selectedMealType === mealType.id;

            return (
              <Pressable
                key={mealType.id}
                onPress={() => onSelectMealType(mealType.id)}
                className={`rounded-full border px-4 py-2 ${
                  isSelected ? 'border-white bg-white' : 'border-white/40 bg-white/10'
                }`}>
                <Text className={`text-sm font-sans-medium ${isSelected ? 'text-blue-spruce-800' : 'text-white'}`}>
                  {mealType.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={onContinue} className="mt-10 flex-row items-center justify-center gap-2 rounded-full bg-white py-4">
        <Text className="font-sans-semibold text-base text-blue-spruce-800">Continue</Text>
        <Ionicons name="arrow-forward" size={18} color="#168376" />
      </Pressable>
    </>
  );
}
