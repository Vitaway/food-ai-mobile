import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskCoachButton } from '@/components/chat/AskCoachButton';
import { MealPhotoHero } from '@/components/meal/MealPhotoHero';
import { MealPipelineBanner } from '@/components/meal/MealPipelineBanner';
import {
  MealAwaitingCard,
  MealCoachSpotlight,
  MealHealthInsight,
  MealMetaFooter,
  MealNutrientDeepDive,
  MealNutritionHero,
  MealPlateComposition,
} from '@/components/meal/MealResultSections';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { isApiConfigured } from '@/constants/api';
import { isAwaitingCoachReview, isMealReadable } from '@/constants/mealStatus';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { MealSubmission, NutritionFacts } from '@/types';

function hasConfirmedNutrition(meal: MealSubmission): boolean {
  return Boolean(
    isMealReadable(meal.status) && ((meal.items && meal.items.length > 0) || meal.totalNutrition),
  );
}

export default function MealResultScreen() {
  const insets = useSafeAreaInsets();
  const { push, back } = useNavigateOnce();
  const logAgain = useSinglePress(() => push('/(tabs)/log'));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal } = useMeals();
  const { profile } = useProfile();
  const meal = id ? getMeal(id) : undefined;

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title="Meal" onBack={back} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">
            Meal not found
          </Text>
          <Button label="Go back" className="mt-6" onPress={back} />
        </View>
      </Screen>
    );
  }

  const approved = isMealReadable(meal.status);
  const rejected = meal.status === 'rejected';
  const awaitingCoach = isAwaitingCoachReview(meal.status);
  const showNutrition = hasConfirmedNutrition(meal);
  const totals: NutritionFacts | undefined = meal.totalNutrition;
  const coachNote = meal.coachReview?.note?.trim();
  const targets = profile?.macroTargets ?? {
    calories: 2000,
    proteinG: 55,
    carbsG: 250,
    fatG: 70,
    fiberG: 30,
  };

  const chatLabel = approved
    ? 'Ask about this review'
    : awaitingCoach
      ? 'Message coach'
      : 'Ask coach about this meal';

  return (
    <Screen edges={[]} className="bg-blue-spruce-800">
      <View className="z-20">
        <ScreenTopBar title="Meal result" onBack={back} />
      </View>
      <ScrollView
        className="z-0 flex-1 bg-ash-grey-50"
        style={{ marginTop: -28 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <MealPhotoHero meal={meal} />

        <View className="-mt-4 gap-4 px-4">
          {!approved && !awaitingCoach ? <MealPipelineBanner status={meal.status} /> : null}

          {awaitingCoach ? <MealAwaitingCard meal={meal} /> : null}

          {showNutrition && coachNote ? (
            <MealCoachSpotlight note={coachNote} reviewedAt={meal.coachReview?.reviewedAt} />
          ) : null}

          {showNutrition && totals ? (
            <MealNutritionHero totals={totals} targets={targets} />
          ) : null}

          {showNutrition ? (
            <MealHealthInsight flag={meal.healthFlag} message={meal.healthMessage} />
          ) : null}

          {showNutrition && meal.items?.length ? (
            <MealPlateComposition items={meal.items} petals={meal.petals} />
          ) : null}

          {awaitingCoach ? (
            <View className="rounded-[28px] bg-white px-5 py-5">
              <Text className="mb-2 text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                Vitamins & minerals
              </Text>
              <View className="items-center rounded-2xl bg-ash-grey-50 px-4 py-5">
                <Text className="font-sans-semibold text-ash-grey-700">Unlocks after review</Text>
                <Text className="mt-1.5 text-center text-sm leading-5 text-ash-grey-500">
                  Micronutrients depend on exact portions. Your coach confirms weights first, then
                  you get the full picture.
                </Text>
              </View>
            </View>
          ) : null}

          {showNutrition && totals ? (
            <MealNutrientDeepDive totals={totals} items={meal.items} />
          ) : null}

          {showNutrition || meal.note?.trim() ? <MealMetaFooter meal={meal} /> : null}

          {/* Coach note fallback if nutrition not yet shown but note exists (rare) */}
          {!showNutrition && coachNote ? (
            <MealCoachSpotlight note={coachNote} reviewedAt={meal.coachReview?.reviewedAt} />
          ) : null}

          <View className="mt-1 gap-2.5">
            {rejected ? (
              <Button label="Log next meal" variant="secondary" onPress={logAgain} />
            ) : null}
            {isApiConfigured() ? <AskCoachButton mealId={meal.id} label={chatLabel} /> : null}
            {approved ? (
              <Button label="Log next meal" variant="outline" onPress={logAgain} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
