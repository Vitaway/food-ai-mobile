import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { IngredientFlowerChart } from '@/components/log/IngredientFlowerChart';
import { IngredientList } from '@/components/log/IngredientList';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';

type LogResultsStepProps = {
  bottomPadding: number;
  analysis: MealAnalysisPreview;
  imageUri?: string;
  saving?: boolean;
  onBack: () => void;
  onSave: () => void;
};

const FLAG_STYLES = {
  green: 'bg-shamrock-100 text-shamrock-800',
  yellow: 'bg-amber-100 text-amber-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
} as const;

export function LogResultsStep({
  bottomPadding,
  analysis,
  imageUri,
  saving,
  onBack,
  onSave,
}: LogResultsStepProps) {
  const ingredients = analysis.items.map((item) => ({
    id: item.id,
    name: item.label,
    weightG: item.estimatedWeightG,
    emoji: item.emoji ?? '🍽️',
    macros: {
      carbs: `${item.nutrition.carbsG}g`,
      fats: `${item.nutrition.fatG}g`,
      sugar: `${item.nutrition.sugarG ?? 0}g`,
    },
  }));

  const flagStyle = FLAG_STYLES[analysis.healthFlag];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-ash-grey-100">
          <Ionicons name="arrow-back" size={20} color="#4f5346" />
        </Pressable>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-cinnamon-wood-100">
          <Ionicons name="bookmark-outline" size={20} color="#b5654a" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}>
        <View className={`rounded-2xl px-4 py-3 ${flagStyle.split(' ')[0]}`}>
          <Text className={`font-sans-semibold ${flagStyle.split(' ')[1]}`}>{analysis.healthMessage}</Text>
        </View>

        <IngredientFlowerChart imageUri={imageUri} petals={analysis.petals} />

        <View className="mt-2 items-center">
          <Text className="font-sans-bold text-2xl text-neutral-900">{analysis.mealName}</Text>
          <Text className="mt-1 text-base text-neutral-500">
            {analysis.totalWeightG} g · {analysis.totalNutrition.caloriesKcal} kcal
          </Text>
          <Text className="mt-1 text-sm text-neutral-400">
            {Math.round(analysis.confidenceAvg * 100)}% confidence
          </Text>
        </View>

        <View className="mt-8">
          <Text className="mb-4 font-sans-semibold text-lg text-neutral-900">Ingredients breakdown</Text>
          <IngredientList ingredients={ingredients} />
        </View>

        <View className="mt-8 gap-3">
          <Button label={saving ? 'Saving…' : 'Save to diary'} onPress={onSave} disabled={saving} />
          <Button label="Edit items" variant="outline" onPress={onBack} />
        </View>
      </ScrollView>
    </View>
  );
}
