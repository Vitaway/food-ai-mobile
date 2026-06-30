import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';
import type { DetectedFoodItem } from '@/types';

type EditableMealItemsProps = {
  items: DetectedFoodItem[];
  onChangeItem: (id: string, patch: Partial<Pick<DetectedFoodItem, 'label' | 'estimatedWeightG'>>) => void;
  onRemoveItem: (id: string) => void;
};

export function EditableMealItems({ items, onChangeItem, onRemoveItem }: EditableMealItemsProps) {
  return (
    <View className="gap-3">
      {items.map((item) => (
        <View key={item.id} className="rounded-2xl border border-ash-grey-200 bg-ash-grey-50 p-4">
          <View className="flex-row items-start gap-3">
            <Text className="text-2xl">{item.emoji ?? '🍽️'}</Text>
            <View className="min-w-0 flex-1 gap-3">
              <AppTextInput
                value={item.label}
                onChangeText={(label) => onChangeItem(item.id, { label })}
                placeholder="Ingredient name"
                className="rounded-xl border border-ash-grey-200 bg-white px-3"
              />

              <View className="flex-row items-center justify-between">
                <Text className="font-sans-medium text-sm text-neutral-600">Portion (g)</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() =>
                      onChangeItem(item.id, { estimatedWeightG: Math.max(1, item.estimatedWeightG - 10) })
                    }
                    className="h-9 w-9 items-center justify-center rounded-full bg-white border border-ash-grey-200">
                    <Ionicons name="remove" size={18} color="#4f5346" />
                  </Pressable>
                  <Text className="min-w-[48px] text-center font-sans-semibold text-neutral-900">
                    {item.estimatedWeightG}
                  </Text>
                  <Pressable
                    onPress={() => onChangeItem(item.id, { estimatedWeightG: item.estimatedWeightG + 10 })}
                    className="h-9 w-9 items-center justify-center rounded-full bg-white border border-ash-grey-200">
                    <Ionicons name="add" size={18} color="#4f5346" />
                  </Pressable>
                </View>
              </View>

              <Text className="text-xs text-neutral-500">
                {item.nutrition.caloriesKcal} kcal · P {item.nutrition.proteinG}g · C {item.nutrition.carbsG}g
              </Text>
            </View>

            <Pressable
              onPress={() => onRemoveItem(item.id)}
              className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
              accessibilityLabel="Remove item">
              <Ionicons name="trash-outline" size={18} color="#b91c1c" />
            </Pressable>
          </View>
        </View>
      ))}

      {items.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-ash-grey-300 px-4 py-6">
          <Text className="text-center text-sm text-neutral-500">No items left. Delete this meal or add items by re-logging.</Text>
        </View>
      ) : null}
    </View>
  );
}
