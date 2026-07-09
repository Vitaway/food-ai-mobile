import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Ingredient = {
  id: string;
  name: string;
  weightG: number;
  servingUnit?: string;
  servingAmount?: number;
  emoji: string;
  macros: { carbs: string; fats: string; sugar: string };
};

type IngredientListProps = {
  ingredients: Ingredient[];
  onCycleServingUnit?: (ingredientId: string) => void;
  onAdjustServingAmount?: (ingredientId: string, delta: number) => void;
};

export function IngredientList({
  ingredients,
  onCycleServingUnit,
  onAdjustServingAmount,
}: IngredientListProps) {
  return (
    <View className="gap-3">
      {ingredients.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center gap-3 rounded-3xl bg-ash-grey-50 px-4 py-3"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 1,
          }}>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
            <Text className="text-2xl">{item.emoji}</Text>
          </View>

          <View className="flex-1">
            <Text className="font-sans-semibold text-base text-neutral-900">{item.name}</Text>
            <Text className="text-sm text-neutral-500">{item.weightG} g</Text>
            {item.servingUnit ? (
              <View className="mt-1 flex-row items-center gap-2">
                <Pressable
                  onPress={() => onAdjustServingAmount?.(item.id, -0.5)}
                  className="rounded-full bg-white px-2 py-0.5">
                  <Text className="text-sm text-blue-spruce-700">−</Text>
                </Pressable>
                <Pressable
                  onPress={() => onCycleServingUnit?.(item.id)}
                  className="rounded-full bg-blue-spruce-50 px-2 py-0.5">
                  <Text className="text-xs text-blue-spruce-700">
                    {item.servingAmount ?? 1} {item.servingUnit}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onAdjustServingAmount?.(item.id, 0.5)}
                  className="rounded-full bg-white px-2 py-0.5">
                  <Text className="text-sm text-blue-spruce-700">+</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View className="items-end gap-1">
            <View className="flex-row items-center gap-2">
              <Ionicons name="nutrition-outline" size={12} color="#50af73" />
              <Text className="text-xs text-neutral-500">{item.macros.carbs}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="water-outline" size={12} color="#c4846e" />
              <Text className="text-xs text-neutral-500">{item.macros.fats}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="cube-outline" size={12} color="#b5654a" />
              <Text className="text-xs text-neutral-500">{item.macros.sugar}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
