import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Ingredient = {
  id: string;
  name: string;
  weightG: number;
  emoji: string;
  macros: { carbs: string; fats: string; sugar: string };
};

type IngredientListProps = {
  ingredients: Ingredient[];
};

export function IngredientList({ ingredients }: IngredientListProps) {
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
