import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskCoachButton } from '@/components/chat/AskCoachButton';
import {
  BalancedPlateCard,
  EstimateHonestyBanner,
} from '@/components/meal/BalancedPlateCard';
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
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { isApiConfigured } from '@/constants/api';
import {
  isAwaitingCoachReview,
  isMealConfirmed,
  isMealEstimate,
  isMealReadable,
} from '@/constants/mealStatus';
import { useI18n } from '@/context/LocaleContext';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import type { DetectedFoodItem, MealSubmission, NutritionFacts } from '@/types';
import {
  estimateRangeFromMid,
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
} from '@/types/balancedPlate';
import { recalculateAnalysisTotals, scaleItemToGrams } from '@/utils/servingUnits';

const PORTION_DEBOUNCE_MS = 400;

function hasDisplayNutrition(meal: MealSubmission): boolean {
  return Boolean(
    isMealReadable(meal.status) && ((meal.items && meal.items.length > 0) || meal.totalNutrition),
  );
}

function withScaledItem(meal: MealSubmission, itemId: string, grams: number): MealSubmission {
  if (!meal.items?.length) return meal;
  const items = meal.items.map((item) =>
    item.id === itemId ? scaleItemToGrams(item, grams) : item,
  );
  const totals = recalculateAnalysisTotals(items);
  const grouped = withInferredPlateGroups(items);
  const balancedPlate = resolveBalancedPlateForMeal({
    mealType: meal.mealType,
    items: grouped,
  });
  const estimateRange =
    meal.status === 'approved'
      ? null
      : estimateRangeFromMid(totals.totalNutrition.caloriesKcal, meal.logSource ?? 'photo');

  return {
    ...meal,
    items,
    totalNutrition: totals.totalNutrition,
    balancedPlate,
    estimateRange,
  };
}

export default function MealResultScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { push, back } = useNavigateOnce();
  const logAgain = useSinglePress(() => push('/(tabs)/log'));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal, updateMealPortions } = useMeals();
  const { profile } = useProfile();
  const stored = id ? getMeal(id) : undefined;

  const [draft, setDraft] = useState<MealSubmission | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const editingRef = useRef(false);

  useEffect(() => {
    if (editingRef.current) return;
    setDraft(null);
  }, [stored]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const meal = draft ?? stored;

  const confirmed = meal ? isMealConfirmed(meal.status) : false;
  const rejected = meal?.status === 'rejected';
  const awaitingCoach = meal ? isAwaitingCoachReview(meal.status) : false;
  const showNutrition = meal ? hasDisplayNutrition(meal) : false;
  const totals: NutritionFacts | undefined = meal?.totalNutrition;
  const coachNote = meal?.coachReview?.note?.trim();
  const targets = profile?.macroTargets ?? {
    calories: 2000,
    proteinG: 55,
    carbsG: 250,
    fatG: 70,
    fiberG: 30,
  };

  const portionsEditable = Boolean(
    meal && isMealEstimate(meal.status) && meal.items?.length,
  );
  const exactPortions = meal?.logSource === 'barcode';

  const honesty = useMemo(() => {
    if (!meal) return { balancedPlate: null, estimateRange: null };
    const items = withInferredPlateGroups(meal.items ?? []);
    const balancedPlate =
      meal.balancedPlate ?? resolveBalancedPlateForMeal({ mealType: meal.mealType, items });
    const mid = meal.totalNutrition?.caloriesKcal ?? 0;
    const estimateRange =
      meal.estimateRange ??
      (isMealEstimate(meal.status) && mid > 0
        ? estimateRangeFromMid(mid, meal.logSource ?? 'photo')
        : null);
    return { balancedPlate, estimateRange };
  }, [meal]);

  const chatLabel = confirmed
    ? t.meal.askAboutReview
    : awaitingCoach
      ? t.meal.messageCoach
      : t.chat.askCoach;

  const handleGramsChange = (itemId: string, grams: number) => {
    if (!meal || !portionsEditable) return;
    editingRef.current = true;
    const next = withScaledItem(meal, itemId, grams);
    setDraft(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++seqRef.current;
    const payload = (next.items ?? []).map((item: DetectedFoodItem) => ({
      id: item.id,
      estimatedWeightG: item.estimatedWeightG,
    }));

    debounceRef.current = setTimeout(() => {
      void updateMealPortions(meal.id, payload)
        .then(() => {
          if (seq !== seqRef.current) return;
          editingRef.current = false;
          setDraft(null);
        })
        .catch(() => {
          if (seq !== seqRef.current) return;
          editingRef.current = false;
          setDraft(null);
          toast.error(t.meal.portionSaveFailed);
        });
    }, PORTION_DEBOUNCE_MS);
  };

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title={t.meal.title} onBack={back} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">
            {t.meal.notFound}
          </Text>
          <Button label={t.meal.goBack} className="mt-6" onPress={back} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} className="bg-blue-spruce-800">
      <View className="z-20">
        <ScreenTopBar title={t.meal.resultTitle} onBack={back} />
      </View>
      <ScrollView
        className="z-0 flex-1 bg-ash-grey-50"
        style={{ marginTop: -28 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <MealPhotoHero meal={meal} />

        <View className="-mt-4 gap-4 px-4">
          <FreePlanBanner compact />

          {!confirmed && !awaitingCoach ? <MealPipelineBanner status={meal.status} /> : null}

          {awaitingCoach && !showNutrition ? <MealAwaitingCard meal={meal} /> : null}

          {showNutrition && honesty.estimateRange && honesty.estimateRange.pct > 0 ? (
            <EstimateHonestyBanner
              midKcal={honesty.estimateRange.midKcal}
              lowKcal={honesty.estimateRange.lowKcal}
              highKcal={honesty.estimateRange.highKcal}
              pct={honesty.estimateRange.pct}
            />
          ) : null}

          {showNutrition && coachNote ? (
            <MealCoachSpotlight note={coachNote} reviewedAt={meal.coachReview?.reviewedAt} />
          ) : null}

          {showNutrition && totals ? (
            <MealNutritionHero totals={totals} targets={targets} />
          ) : null}

          {showNutrition ? (
            <BalancedPlateCard score={honesty.balancedPlate} mealType={meal.mealType} />
          ) : null}

          {showNutrition ? (
            <MealHealthInsight flag={meal.healthFlag} message={meal.healthMessage} />
          ) : null}

          {showNutrition && meal.items?.length ? (
            <MealPlateComposition
              items={meal.items}
              petals={meal.petals}
              editable={portionsEditable}
              exact={exactPortions}
              lockedHint={
                confirmed
                  ? t.log.portionLockedHint
                  : portionsEditable
                    ? t.log.portionLiveHint
                    : undefined
              }
              onChangeGrams={portionsEditable ? handleGramsChange : undefined}
            />
          ) : null}

          {awaitingCoach && !showNutrition ? (
            <View className="rounded-[28px] bg-white px-5 py-5">
              <Text className="mb-2 text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                {t.meal.vitaminsMinerals}
              </Text>
              <View className="items-center rounded-2xl bg-ash-grey-50 px-4 py-5">
                <Text className="font-sans-semibold text-ash-grey-700">{t.meal.unlocksAfterReview}</Text>
                <Text className="mt-1.5 text-center text-sm leading-5 text-ash-grey-500">
                  {t.meal.microsHint}
                </Text>
              </View>
            </View>
          ) : null}

          {showNutrition && totals ? (
            <MealNutrientDeepDive totals={totals} items={meal.items} />
          ) : null}

          {showNutrition || meal.note?.trim() ? <MealMetaFooter meal={meal} /> : null}

          {!showNutrition && coachNote ? (
            <MealCoachSpotlight note={coachNote} reviewedAt={meal.coachReview?.reviewedAt} />
          ) : null}

          <View className="mt-1 gap-2.5">
            {rejected ? (
              <Button label={t.meal.logNext} variant="secondary" onPress={logAgain} />
            ) : null}
            {isApiConfigured() ? <AskCoachButton mealId={meal.id} label={chatLabel} /> : null}
            {confirmed || awaitingCoach ? (
              <Button label={t.meal.logNext} variant="outline" onPress={logAgain} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
