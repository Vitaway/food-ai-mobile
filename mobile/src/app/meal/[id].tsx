import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { MealInsightsCarousel } from '@/components/meal/MealInsightsCarousel';
import { MealPhotoHero } from '@/components/meal/MealPhotoHero';
import { MealPipelineBanner } from '@/components/meal/MealPipelineBanner';
import { AskCoachButton } from '@/components/chat/AskCoachButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { isApiConfigured } from '@/constants/api';
import { isAwaitingCoachReview, isMealReadable } from '@/constants/mealStatus';
import { semanticColors } from '@/design-system/colors';
import { useMeals } from '@/context/MealsContext';
import type { MealSubmission, NutritionFacts } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useSinglePress } from '@/hooks/useSinglePress';
import {
  fetchCoachAuthoredInsights,
  type CoachAuthoredInsight,
} from '@/services/remote/consumerApi';
import { formatMacroG } from '@/utils/formatMacro';

const RING = 74;
const RING_R = 31;
const RING_C = 2 * Math.PI * RING_R;

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

function hasConfirmedNutrition(meal: MealSubmission): boolean {
  return Boolean(
    isMealReadable(meal.status) && ((meal.items && meal.items.length > 0) || meal.totalNutrition),
  );
}

function MacroBar({
  label,
  value,
  percent,
  color,
  dashed,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
  dashed?: boolean;
}) {
  const width = `${Math.max(4, Math.min(100, percent))}%`;
  return (
    <View className="mb-2">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-[11px] text-neutral-600">{label}</Text>
        <Text className="text-[11px] font-sans-semibold text-neutral-900">{value}</Text>
      </View>
      <View
        className={`h-1.5 overflow-hidden rounded-full ${dashed ? 'border border-dashed border-amber-200 bg-white' : 'bg-white'}`}>
        <View className="h-full rounded-full" style={{ width: width as `${number}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

function CalorieRing({
  kcal,
  progress,
  color,
  estimate,
}: {
  kcal: string;
  progress: number;
  color: string;
  estimate?: boolean;
}) {
  const dash = Math.max(0, Math.min(1, progress)) * RING_C;
  return (
    <View style={{ width: RING, height: RING }} className="items-center justify-center">
      <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING / 2} cy={RING / 2} r={RING_R} stroke="#ffffff" strokeWidth={7} fill="none" />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RING_R}
          stroke={color}
          strokeWidth={7}
          fill="none"
          strokeDasharray={`${dash} ${RING_C}`}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="font-sans-bold text-[19px] leading-5 text-neutral-900">
          {estimate ? `~${kcal}` : kcal}
        </Text>
        <Text className="text-[9px] uppercase tracking-wide text-neutral-400">kcal</Text>
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-1 text-[11px] font-sans-bold uppercase tracking-[0.07em] text-neutral-400">
      {children}
    </Text>
  );
}

export default function MealResultScreen() {
  const insets = useSafeAreaInsets();
  const { push, back } = useNavigateOnce();
  const logAgain = useSinglePress(() => push('/(tabs)/log'));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeal } = useMeals();
  const meal = id ? getMeal(id) : undefined;
  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const [coachInsights, setCoachInsights] = useState<CoachAuthoredInsight[]>([]);

  useEffect(() => {
    if (!isApiConfigured() || !meal || !isMealReadable(meal.status)) return;
    let cancelled = false;
    void fetchCoachAuthoredInsights()
      .then((items) => {
        if (!cancelled) setCoachInsights(items);
      })
      .catch(() => {
        if (!cancelled) setCoachInsights([]);
      });
    return () => {
      cancelled = true;
    };
  }, [meal?.id, meal?.status]);

  const ingredients = useMemo(() => {
    if (!meal?.items?.length) return [];
    return meal.items.map((item) => ({
      id: item.id,
      name: item.label,
      weightG: item.estimatedWeightG,
      emoji: item.emoji ?? '🍽️',
      kcal: Math.round(item.nutrition.caloriesKcal),
    }));
  }, [meal?.items]);

  if (!meal) {
    return (
      <Screen edges={[]}>
        <ScreenTopBar title="Meal" onBack={back} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">Meal not found</Text>
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
  const reviewedAt = meal.coachReview?.reviewedAt
    ? new Date(meal.coachReview.reviewedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const protein = totals?.proteinG ?? 0;
  const carbs = totals?.carbsG ?? 0;
  const fat = totals?.fatG ?? 0;
  const kcal = totals?.caloriesKcal ?? 0;
  const proteinPct = Math.min(100, Math.round((protein / 55) * 100));
  const carbsPct = Math.min(100, Math.round((carbs / 250) * 100));
  const fatPct = Math.min(100, Math.round((fat / 70) * 100));
  const kcalProgress = Math.min(1, kcal / 2000);

  const chatLabel = approved
    ? 'Ask about this review'
    : awaitingCoach
      ? 'Message coach'
      : 'Ask coach about this meal';

  return (
    <Screen edges={[]}>
      <ScreenTopBar title="Meal" onBack={back} />
      <ScrollView
        className="flex-1 bg-[#EEF3F6]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <MealPhotoHero meal={meal} />

        <View className="-mt-3 gap-3 px-4">
          <View className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-black/5">
            <Text className="text-xs text-neutral-500">Logged {formatSubmittedAt(meal.submittedAt)}</Text>
          </View>

          {!approved && !awaitingCoach ? <MealPipelineBanner status={meal.status} /> : null}

          {/* Waiting / estimate card */}
          {awaitingCoach ? (
            <View className="rounded-2xl border-[1.5px] border-dashed border-[#EFD9AE] bg-[#FDF4E3] px-4 py-4">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-[17px] w-[17px] items-center justify-center rounded-full bg-[#A9740B]">
                  <View className="h-1.5 w-1.5 rounded-full bg-white" />
                </View>
                <Text className="text-xs font-sans-semibold text-[#A9740B]">
                  Waiting for coach review
                </Text>
              </View>
              <Text className="text-sm leading-5 text-neutral-600">
                Nutrition unlocks after your coach confirms portions. You can message them anytime.
              </Text>
              {(meal.note || meal.textInput) ? (
                <View className="mt-3 rounded-xl bg-white/70 px-3 py-2.5">
                  <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-neutral-400">
                    Your description
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-neutral-700">
                    {meal.note || meal.textInput}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Verified nutrition hero */}
          {showNutrition && totals ? (
            <View className="rounded-2xl border border-[#BEE5D6] bg-[#E4F5EE] px-4 py-4">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-[17px] w-[17px] items-center justify-center rounded-full bg-[#1D9E75]">
                  <Ionicons name="checkmark" size={11} color="#ffffff" />
                </View>
                <Text className="flex-1 text-xs font-sans-semibold text-[#0F6E56]">
                  Verified by your coach
                </Text>
                {reviewedAt ? <Text className="text-[11px] text-neutral-500">{reviewedAt}</Text> : null}
              </View>

              <View className="flex-row items-center gap-3">
                <CalorieRing
                  kcal={String(Math.round(kcal))}
                  progress={kcalProgress}
                  color="#1D9E75"
                />
                <View className="min-w-0 flex-1">
                  <MacroBar
                    label="Protein"
                    value={`${formatMacroG(protein)}`}
                    percent={proteinPct}
                    color="#1D9E75"
                  />
                  <MacroBar
                    label="Carbs"
                    value={`${formatMacroG(carbs)}`}
                    percent={carbsPct}
                    color="#023459"
                  />
                  <MacroBar
                    label="Fat"
                    value={`${formatMacroG(fat)}`}
                    percent={fatPct}
                    color={semanticColors.accentOrange}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Coach note — product moment */}
          {coachNote ? (
            <View className="rounded-2xl bg-[#023459] px-4 py-4">
              <View className="mb-2 flex-row items-center gap-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#FF6F32]">
                  <Text className="text-[11px] font-sans-bold text-white">C</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-semibold text-sm text-white">Your coach</Text>
                  <Text className="text-[11px] text-[#9DC2DC]">Nutritionist · Vitaway</Text>
                </View>
              </View>
              <Text className="text-[13px] leading-5 text-[#DCEAF3]">{coachNote}</Text>
            </View>
          ) : null}

          {/* Confirmed items */}
          {showNutrition && ingredients.length > 0 ? (
            <View className="rounded-2xl bg-white px-4 py-3">
              <SectionLabel>Confirmed items</SectionLabel>
              {ingredients.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-3 py-2.5 ${
                    index < ingredients.length - 1 ? 'border-b border-ash-grey-100' : ''
                  }`}>
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#EEF3F6]">
                    <Text className="text-[13px]">{item.emoji}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans-semibold text-[13px] text-neutral-900" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-[11px] text-neutral-400">
                      {item.weightG > 0 ? `${Math.round(item.weightG)} g` : 'Portion confirmed'}
                    </Text>
                  </View>
                  <Text className="text-xs tabular-nums text-neutral-500">{item.kcal}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Micros locked until review */}
          {awaitingCoach ? (
            <View className="rounded-2xl bg-white px-4 py-4">
              <SectionLabel>Vitamins & minerals</SectionLabel>
              <View className="items-center rounded-xl bg-[#EEF3F6] px-4 py-4">
                <Text className="font-sans-semibold text-[13px] text-neutral-600">
                  Unlocks after review
                </Text>
                <Text className="mt-1 text-center text-xs leading-5 text-neutral-400">
                  Micronutrients depend on exact portions. Your coach confirms weights first, then you
                  get the full picture.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Tips & insights — sliding cards */}
          {showNutrition ? (
            <MealInsightsCarousel meal={meal} coachInsights={coachInsights} />
          ) : null}

          {/* Expandable nutrient summary */}
          {showNutrition && totals ? (
            <View className="overflow-hidden rounded-xl border border-ash-grey-100 bg-white">
              <Pressable
                onPress={() => setShowAllNutrients((v) => !v)}
                className="flex-row items-center gap-2 px-3.5 py-3 active:bg-ash-grey-50">
                <Text className="flex-1 font-sans-semibold text-[13px] text-neutral-900">
                  See macros detail
                </Text>
                <Ionicons
                  name={showAllNutrients ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#8B9AA5"
                />
              </Pressable>
              {showAllNutrients ? (
                <View className="gap-2 border-t border-ash-grey-100 px-3.5 py-3">
                  {(
                    [
                      ['Energy', `${Math.round(kcal)} kcal`],
                      ['Protein', formatMacroG(protein)],
                      ['Carbohydrate', formatMacroG(carbs)],
                      ['Fat', formatMacroG(fat)],
                      ['Fiber', formatMacroG(totals.fiberG)],
                      ['Sugar', formatMacroG(totals.sugarG ?? 0)],
                      ['Sodium', `${Math.round(totals.sodiumMg ?? 0)} mg`],
                    ] as const
                  ).map(([label, value]) => (
                    <View key={label} className="flex-row items-center justify-between py-0.5">
                      <Text className="text-xs text-neutral-500">{label}</Text>
                      <Text className="text-xs font-sans-semibold tabular-nums text-neutral-800">
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Patient note when verified (don't duplicate in waiting card) */}
          {showNutrition && meal.note ? (
            <View className="rounded-2xl bg-white px-4 py-3">
              <Text className="font-sans-semibold text-sm text-neutral-900">Your note</Text>
              <Text className="mt-1.5 text-sm leading-5 text-neutral-600">{meal.note}</Text>
            </View>
          ) : null}

          <View className="mt-1 gap-2">
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
