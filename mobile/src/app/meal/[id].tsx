import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MealPipelineBanner } from '@/components/meal/MealPipelineBanner';
import { MealStatusBadge } from '@/components/meal/MealStatusBadge';
import { IngredientList } from '@/components/log/IngredientList';
import { LogCard } from '@/components/log/LogScreenShell';
import { AskCoachButton } from '@/components/chat/AskCoachButton';
import { Button } from '@/components/ui/Button';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { MEAL_TYPE_OPTIONS } from '@/constants/mealTypes';
import { isApiConfigured } from '@/constants/api';
import { isMealReadable } from '@/constants/mealStatus';
import { semanticColors } from '@/design-system/colors';
import { useMeals } from '@/context/MealsContext';
import type { MealSubmission, NutritionFacts } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import { formatMacroG } from '@/utils/formatMacro';

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800', icon: '#1D9E75' as const },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '#b45309' as const },
  orange: { bg: 'bg-cinnamon-wood-100', text: 'text-cinnamon-wood-700', icon: '#c45c26' as const },
  red: { bg: 'bg-red-100', text: 'text-red-800', icon: '#b91c1c' as const },
};

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function mealTypeMeta(mealType: MealSubmission['mealType']) {
  return MEAL_TYPE_OPTIONS.find((option) => option.id === mealType) ?? MEAL_TYPE_OPTIONS[1];
}

function hasNutritionDetails(meal: MealSubmission): boolean {
  return Boolean((meal.items && meal.items.length > 0) || meal.totalNutrition);
}

function totalWeightG(meal: MealSubmission): number {
  if (meal.items?.length) {
    return meal.items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  }
  return 0;
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-3">
      <Text className="text-xs text-neutral-500">{label}</Text>
      <Text className="mt-1 font-sans-bold text-lg" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function MealHero({ meal }: { meal: MealSubmission }) {
  const mealType = mealTypeMeta(meal.mealType);

  if (meal.imageUrl) {
    return (
      <View className="relative h-[220px] w-full overflow-hidden bg-ash-grey-200">
        <Image source={{ uri: meal.imageUrl }} className="h-full w-full" resizeMode="cover" />
        <View className="absolute inset-0 bg-black/25" />
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12">
          <View className="flex-row items-end justify-between gap-3">
            <View className="min-w-0 flex-1">
              <View className="mb-2 flex-row items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-1">
                <Ionicons name={mealType.icon} size={14} color="#ffffff" />
                <Text className="text-xs font-sans-semibold text-white">{mealType.label}</Text>
              </View>
              <Text className="font-sans-bold text-2xl leading-8 text-white" numberOfLines={2}>
                {meal.mealName ?? 'Logged meal'}
              </Text>
            </View>
            <MealStatusBadge status={meal.status} size="md" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="px-5 pb-5 pt-2" style={{ backgroundColor: BRAND_HEADER_COLOR }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name={mealType.icon} size={28} color="#ffffff" />
          </View>
          <Text className="font-sans-bold text-2xl leading-8 text-white" numberOfLines={2}>
            {meal.mealName ?? 'Logged meal'}
          </Text>
          <Text className="mt-1 text-sm text-white/75">{mealType.label}</Text>
        </View>
        <MealStatusBadge status={meal.status} size="md" />
      </View>
    </View>
  );
}

export default function MealResultScreen() {
  const insets = useSafeAreaInsets();
  const { push, back } = useNavigateOnce();
  const logAgain = useSinglePress(() => push('/(tabs)/log'));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal } = useMeals();
  const meal = id ? getMeal(id) : undefined;

  const ingredients = useMemo(() => {
    if (!meal?.items?.length) return [];
    return meal.items.map((item) => ({
      id: item.id,
      name: item.label,
      weightG: item.estimatedWeightG,
      emoji: item.emoji ?? '🍽️',
      macros: {
        carbs: formatMacroG(item.nutrition.carbsG),
        fats: formatMacroG(item.nutrition.fatG),
        sugar: formatMacroG(item.nutrition.sugarG ?? 0),
      },
    }));
  }, [meal?.items]);

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title="Meal" onBack={back} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-ash-grey-100">
            <Ionicons name="restaurant-outline" size={32} color="#9ca3af" />
          </View>
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">Meal not found</Text>
          <Text className="mt-2 text-center text-sm text-neutral-500">It may have been removed from your diary.</Text>
          <Button label="Go back" className="mt-6" onPress={back} />
        </View>
      </Screen>
    );
  }

  const approved = isMealReadable(meal.status);
  const rejected = meal.status === 'rejected';
  const showNutrition = hasNutritionDetails(meal);
  const totals: NutritionFacts | undefined = meal.totalNutrition;
  const flag = meal.healthFlag ? FLAG_STYLES[meal.healthFlag] : FLAG_STYLES.green;
  const weight = totalWeightG(meal);
  const coachNote = meal.coachReview?.note?.trim();

  return (
    <Screen edges={[]}>
      <ScreenTopBar title="Meal" onBack={back} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <MealHero meal={meal} />

        <View className="-mt-4 gap-4 px-5">
          {meal.imageUrl ? (
            <LogCard className="py-3">
              <Text className="text-xs text-neutral-500">Logged {formatSubmittedAt(meal.submittedAt)}</Text>
            </LogCard>
          ) : (
            <Text className="px-1 text-xs text-neutral-500">Logged {formatSubmittedAt(meal.submittedAt)}</Text>
          )}

          {!approved ? <MealPipelineBanner status={meal.status} /> : null}

          {showNutrition && meal.healthMessage ? (
            <View className={`flex-row gap-3 rounded-2xl px-4 py-3.5 ${flag.bg}`}>
              <Ionicons name="leaf-outline" size={20} color={flag.icon} />
              <Text className={`flex-1 text-sm leading-5 ${flag.text}`}>{meal.healthMessage}</Text>
            </View>
          ) : null}

          {coachNote ? (
            <LogCard className="border border-blue-spruce-100 bg-blue-spruce-50/50">
              <View className="flex-row items-center gap-2">
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#023459" />
                <Text className="font-sans-semibold text-sm text-blue-spruce-800">Coach note</Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-blue-spruce-900">{coachNote}</Text>
            </LogCard>
          ) : null}

          {showNutrition && totals ? (
            <LogCard>
              <Text className="text-sm text-neutral-500">Nutrition estimate</Text>
              <View className="mt-2 flex-row items-end justify-between">
                <Text className="font-sans-bold text-4xl text-neutral-900">{totals.caloriesKcal}</Text>
                <Text className="pb-1 font-sans-semibold text-lg text-neutral-500">kcal</Text>
              </View>
              {weight > 0 ? (
                <Text className="mt-1 text-sm text-neutral-500">{weight} g total · AI estimate</Text>
              ) : null}

              <View className="mt-4 flex-row gap-2">
                <MacroPill label="Protein" value={formatMacroG(totals.proteinG)} color="#1D9E75" />
                <MacroPill label="Carbs" value={formatMacroG(totals.carbsG)} color="#023459" />
                <MacroPill label="Fat" value={formatMacroG(totals.fatG)} color={semanticColors.accentOrange} />
              </View>

              {!approved ? (
                <View className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5">
                  <Text className="text-xs leading-5 text-amber-900">
                    Pending coach review — numbers may change after approval.
                  </Text>
                </View>
              ) : null}
            </LogCard>
          ) : null}

          {meal.note ? (
            <LogCard>
              <Text className="font-sans-semibold text-sm text-neutral-900">Your note</Text>
              <Text className="mt-2 text-sm leading-5 text-neutral-600">{meal.note}</Text>
            </LogCard>
          ) : null}

          {meal.textInput && !meal.note ? (
            <LogCard>
              <Text className="font-sans-semibold text-sm text-neutral-900">Description</Text>
              <Text className="mt-2 text-sm leading-5 text-neutral-600">{meal.textInput}</Text>
            </LogCard>
          ) : null}

          {ingredients.length > 0 ? (
            <LogCard>
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="font-sans-semibold text-base text-neutral-900">Ingredients</Text>
                <Text className="text-sm text-neutral-500">{ingredients.length} items</Text>
              </View>
              <IngredientList ingredients={ingredients} />
            </LogCard>
          ) : null}

          {!showNutrition && !rejected ? (
            <LogCard className="items-center border border-dashed border-ash-grey-200 bg-ash-grey-50 py-8">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-white">
                <Ionicons name="hourglass-outline" size={24} color="#023459" />
              </View>
              <Text className="font-sans-semibold text-base text-neutral-900">Analysis in progress</Text>
              <Text className="mt-2 max-w-[260px] text-center text-sm leading-5 text-neutral-500">
                Nutrition details will appear here once AI finishes analyzing your meal.
              </Text>
            </LogCard>
          ) : null}

          {rejected ? (
            <View className="gap-3">
              <Button label="Log again" variant="secondary" onPress={logAgain} />
            </View>
          ) : isApiConfigured() ? (
            <AskCoachButton mealId={meal.id} />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
