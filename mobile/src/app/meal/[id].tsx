import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';

import { EditableMealItems } from '@/components/meal/EditableMealItems';
import { MealPipelineBanner } from '@/components/meal/MealPipelineBanner';
import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { IngredientFlowerChart } from '@/components/log/IngredientFlowerChart';
import { IngredientList } from '@/components/log/IngredientList';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { isMealReadable } from '@/constants/mealStatus';
import { useMeals } from '@/context/MealsContext';
import type { DetectedFoodItem, MealSubmission } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import { applyMealItems, scaleItemWeight } from '@/utils/mealNutrition';

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

export default function MealResultScreen() {
  const { push, back } = useNavigateOnce();
  const logAgain = useSinglePress(() => push('/(tabs)/log'));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal, updateMeal, deleteMeal } = useMeals();
  const meal = id ? getMeal(id) : undefined;

  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<DetectedFoodItem[]>([]);
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!meal || !isMealReadable(meal.status)) return;
    setDraftItems(meal.items ?? []);
    setDraftNote(meal.note ?? '');
  }, [meal?.id, meal?.status, meal?.items, meal?.note]);

  const readable = meal ? isMealReadable(meal.status) : false;
  const rejected = meal?.status === 'rejected';

  const handleStartEdit = useCallback(() => {
    if (!meal?.items?.length) return;
    setDraftItems(meal.items);
    setDraftNote(meal.note ?? '');
    setEditing(true);
  }, [meal]);

  const handleCancelEdit = useCallback(() => {
    if (!meal) return;
    setDraftItems(meal.items ?? []);
    setDraftNote(meal.note ?? '');
    setEditing(false);
  }, [meal]);

  const handleChangeItem = useCallback(
    (itemId: string, patch: Partial<Pick<DetectedFoodItem, 'label' | 'estimatedWeightG'>>) => {
      setDraftItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) return item;
          let next = { ...item, ...patch };
          if (patch.estimatedWeightG !== undefined && patch.estimatedWeightG !== item.estimatedWeightG) {
            next = scaleItemWeight(item, patch.estimatedWeightG);
          }
          if (patch.label !== undefined) {
            next = { ...next, label: patch.label };
          }
          return next;
        }),
      );
    },
    [],
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setDraftItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!meal || saving) return;
    if (draftItems.length === 0) {
      Alert.alert('No items', 'Keep at least one item or delete the meal.');
      return;
    }

    setSaving(true);
    try {
      const updated: MealSubmission = applyMealItems({ ...meal, note: draftNote.trim() || undefined }, draftItems);
      await updateMeal(updated);
      setEditing(false);
    } catch {
      Alert.alert('Could not save', 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [draftItems, draftNote, meal, saving, updateMeal]);

  const handleDeleteMeal = useCallback(() => {
    if (!meal) return;

    Alert.alert('Delete meal?', 'This removes the meal from your diary.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(meal.id);
          back();
        },
      },
    ]);
  }, [back, deleteMeal, meal]);

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title="Meal" onBack={back} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-neutral-500">Meal not found. It may have been removed.</Text>
          <Button label="Go back" className="mt-6" onPress={back} />
        </View>
      </Screen>
    );
  }

  const flag = meal.healthFlag ? FLAG_STYLES[meal.healthFlag] : FLAG_STYLES.green;
  const displayItems = editing ? draftItems : (meal.items ?? []);
  const ingredients = displayItems.map((item) => ({
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

  const totals = editing ? applyMealItems(meal, draftItems).totalNutrition : meal.totalNutrition;

  return (
    <Screen edges={[]}>
      <ScreenTopBar
        title={editing ? 'Edit meal' : 'Meal'}
        onBack={() => (editing ? handleCancelEdit() : back())}
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-6">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 font-sans-bold text-xl text-neutral-900" numberOfLines={2}>
            {meal.mealName ?? 'Logged meal'}
          </Text>
          <MealStatusBadge status={meal.status} size="md" />
        </View>

        {!readable ? <MealPipelineBanner status={meal.status} /> : null}

        {readable && !editing && meal.healthMessage ? (
          <View className={`rounded-2xl px-4 py-3 ${flag.bg}`}>
            <Text className={`font-sans-semibold ${flag.text}`}>{meal.healthMessage}</Text>
          </View>
        ) : null}

        {meal.imageUrl ? (
          <View className="overflow-hidden rounded-3xl">
            <Image source={{ uri: meal.imageUrl }} className="h-48 w-full" resizeMode="cover" />
          </View>
        ) : null}

        {readable ? (
          <>
            <View className="rounded-3xl bg-white p-5 shadow-sm">
              <Text className="font-sans-bold text-3xl text-neutral-900">{totals?.caloriesKcal ?? 0} kcal</Text>
              {totals ? (
                <Text className="mt-2 text-sm text-neutral-400">
                  P {totals.proteinG}g · C {totals.carbsG}g · F {totals.fatG}g
                </Text>
              ) : null}
            </View>

            {editing ? (
              <View className="gap-2">
                <Text className="font-sans-semibold text-base text-neutral-900">Notes</Text>
                <AppTextInput
                  value={draftNote}
                  onChangeText={setDraftNote}
                  placeholder="Optional note"
                  multiline
                  className="min-h-[80px] rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-4"
                />
              </View>
            ) : meal.note ? (
              <View className="rounded-2xl bg-ash-grey-50 px-4 py-3">
                <Text className="text-xs font-sans-semibold uppercase tracking-wide text-neutral-500">Note</Text>
                <Text className="mt-1 text-sm text-neutral-700">{meal.note}</Text>
              </View>
            ) : null}

            {!editing && meal.petals?.length ? (
              <IngredientFlowerChart imageUri={meal.imageUrl} petals={meal.petals} />
            ) : null}

            <View>
              <Text className="mb-4 font-sans-semibold text-lg text-neutral-900">Ingredients</Text>
              {editing ? (
                <EditableMealItems
                  items={draftItems}
                  onChangeItem={handleChangeItem}
                  onRemoveItem={handleRemoveItem}
                />
              ) : ingredients.length ? (
                <IngredientList ingredients={ingredients} />
              ) : null}
            </View>

            <View className="gap-3">
              {editing ? (
                <>
                  <Button label={saving ? 'Saving…' : 'Save changes'} onPress={handleSaveEdit} disabled={saving} />
                  <Button label="Cancel" variant="outline" onPress={handleCancelEdit} disabled={saving} />
                </>
              ) : (
                <>
                  <Button label="Edit items" variant="outline" onPress={handleStartEdit} />
                  <Button label="Delete meal" variant="ghost" onPress={handleDeleteMeal} />
                </>
              )}
            </View>
          </>
        ) : rejected ? (
          <View className="gap-3">
            <Button label="Log again" onPress={logAgain} />
            <Button label="Delete meal" variant="ghost" onPress={handleDeleteMeal} />
          </View>
        ) : (
          <View className="rounded-3xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-5 py-8">
            <Text className="text-center font-sans-semibold text-neutral-800">Nutrition details locked</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-neutral-500">
              Calories, macros, and ingredients appear here once analysis and review are complete.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
