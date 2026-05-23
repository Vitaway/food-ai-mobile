import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, View } from 'react-native';

import { IngredientFlowerChart } from '@/components/log/IngredientFlowerChart';
import { IngredientList } from '@/components/log/IngredientList';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useMeals } from '@/context/MealsContext';
import { formatTime } from '@/utils/dates';

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

export default function MealResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal } = useMeals();
  const meal = id ? getMeal(id) : undefined;

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title="Meal results" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-neutral-500">Meal not found. It may have been removed.</Text>
          <Button label="Go back" className="mt-6" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const flag = meal.healthFlag ? FLAG_STYLES[meal.healthFlag] : FLAG_STYLES.green;
  const ingredients =
    meal.items?.map((item) => ({
      id: item.id,
      name: item.label,
      weightG: item.estimatedWeightG,
      emoji: item.emoji ?? '🍽️',
      macros: {
        carbs: `${item.nutrition.carbsG}g`,
        fats: `${item.nutrition.fatG}g`,
        sugar: `${item.nutrition.sugarG ?? 0}g`,
      },
    })) ?? [];

  return (
    <Screen edges={[]}>
      <ScreenTopBar
        title="Meal results"
        subtitle={`Logged at ${formatTime(meal.submittedAt)} · ${meal.status}`}
        onBack={() => router.back()}
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-6">
        {meal.healthMessage ? (
          <View className={`rounded-2xl px-4 py-3 ${flag.bg}`}>
            <Text className={`font-sans-semibold ${flag.text}`}>{meal.healthMessage}</Text>
          </View>
        ) : null}

        {meal.imageUrl ? (
          <View className="overflow-hidden rounded-3xl">
            <Image source={{ uri: meal.imageUrl }} className="h-48 w-full" resizeMode="cover" />
          </View>
        ) : null}

        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <Text className="font-sans-bold text-3xl text-neutral-900">
            {meal.totalNutrition?.caloriesKcal ?? 0} kcal
          </Text>
          <Text className="mt-1 text-neutral-500">{meal.mealName ?? 'Logged meal'}</Text>
          {meal.totalNutrition ? (
            <Text className="mt-2 text-sm text-neutral-400">
              P {meal.totalNutrition.proteinG}g · C {meal.totalNutrition.carbsG}g · F {meal.totalNutrition.fatG}g
            </Text>
          ) : null}
        </View>

        {meal.petals?.length ? (
          <IngredientFlowerChart imageUri={meal.imageUrl} petals={meal.petals} />
        ) : null}

        {ingredients.length ? (
          <View>
            <Text className="mb-4 font-sans-semibold text-lg text-neutral-900">Ingredients</Text>
            <IngredientList ingredients={ingredients} />
          </View>
        ) : null}

        <View className="gap-3">
          <Button label="Edit items" variant="outline" onPress={() => router.push('/(tabs)/log')} />
          <Button label="Flag for re-review" variant="ghost" />
        </View>
      </ScrollView>
    </Screen>
  );
}
