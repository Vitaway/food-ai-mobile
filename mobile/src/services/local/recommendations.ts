import { MEAL_TYPES } from '@/constants/mealTypes';
import { MEAL_SWAP_SUGGESTIONS, type MealSwapSuggestion } from '@/data/mealSwapSuggestions';
import type {
  DailyLog,
  HealthGoal,
  MacroTargets,
  MealAnalysisPreview,
  MealSubmission,
  NutritionFacts,
} from '@/types';
import type { MealTypeId } from '@/constants/mealTypes';
import { getDateWindow, todayKey } from '@/utils/dates';

export type RecommendationTone = 'neutral' | 'positive' | 'warning' | 'tip';

export type Recommendation = {
  id: string;
  title: string;
  body: string;
  tone: RecommendationTone;
};

type DayTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

function sumNutrition(meals: MealSubmission[]): DayTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totalNutrition?.caloriesKcal ?? 0),
      proteinG: acc.proteinG + (meal.totalNutrition?.proteinG ?? 0),
      carbsG: acc.carbsG + (meal.totalNutrition?.carbsG ?? 0),
      fatG: acc.fatG + (meal.totalNutrition?.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function addPreview(totals: DayTotals, preview: NutritionFacts): DayTotals {
  return {
    calories: totals.calories + preview.caloriesKcal,
    proteinG: totals.proteinG + preview.proteinG,
    carbsG: totals.carbsG + preview.carbsG,
    fatG: totals.fatG + preview.fatG,
  };
}

function pctOf(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.round((value / target) * 100);
}

function macroTip(
  id: string,
  label: string,
  projected: number,
  target: number,
  tone: RecommendationTone = 'neutral',
): Recommendation | null {
  const pct = pctOf(projected, target);
  if (pct < 55) return null;
  const body =
    pct >= 100
      ? `After this meal you'll be at about ${pct}% of your daily ${label.toLowerCase()}.`
      : `This meal uses roughly ${pct}% of your daily ${label.toLowerCase()} budget.`;
  return {
    id,
    title: `${label} check-in`,
    body,
    tone: pct >= 100 ? 'warning' : tone,
  };
}

export function filterMealSwapSuggestions({
  goal,
  dietaryPreferences,
  limit = 3,
}: {
  goal: HealthGoal;
  dietaryPreferences: string[];
  limit?: number;
}): MealSwapSuggestion[] {
  return MEAL_SWAP_SUGGESTIONS.filter(
    (item) =>
      item.goals.includes(goal) &&
      !(item.incompatibleWith ?? []).some((pref) => dietaryPreferences.includes(pref)),
  ).slice(0, limit);
}

export function getPostLogRecommendations({
  analysis,
  approvedTodayMeals,
  targets,
  waterMl,
  waterTargetMl,
  goal,
  dietaryPreferences,
}: {
  analysis: MealAnalysisPreview;
  approvedTodayMeals: MealSubmission[];
  targets: MacroTargets;
  waterMl: number;
  waterTargetMl: number;
  goal: HealthGoal;
  dietaryPreferences: string[];
}): { tips: Recommendation[]; swaps: MealSwapSuggestion[] } {
  const tips: Recommendation[] = [];
  const todayTotals = sumNutrition(approvedTodayMeals);
  const projected = addPreview(todayTotals, analysis.totalNutrition);

  const calorieTip = macroTip('post-calories', 'Calories', projected.calories, targets.calories);
  if (calorieTip) tips.push(calorieTip);

  const carbsTip = macroTip('post-carbs', 'Carbs', projected.carbsG, targets.carbsG, 'tip');
  if (carbsTip) tips.push(carbsTip);

  const proteinPct = pctOf(projected.proteinG, targets.proteinG);
  if (goal === 'gain_muscle' && proteinPct < 45 && analysis.totalNutrition.proteinG < 25) {
    tips.push({
      id: 'post-protein-low',
      title: 'Protein boost',
      body: `You're at ~${proteinPct}% of today's protein target. Consider adding a lean protein side.`,
      tone: 'tip',
    });
  }

  if (analysis.healthFlag === 'orange' || analysis.healthFlag === 'red') {
    tips.push({
      id: 'post-health-flag',
      title: 'Lighter swap',
      body: 'This meal scored high on calories or saturated fat. A smaller portion or veggie side may balance your day.',
      tone: 'warning',
    });
  }

  const waterPct = pctOf(waterMl, waterTargetMl);
  if (waterPct < 50) {
    tips.push({
      id: 'post-water',
      title: 'Hydration',
      body: `You've logged ${waterPct}% of your water goal today. A glass now helps digestion and energy.`,
      tone: 'tip',
    });
  }

  const swaps = filterMealSwapSuggestions({ goal, dietaryPreferences, limit: 2 });

  return { tips: tips.slice(0, 4), swaps };
}

function inWindow(dateKey: string, start: string, end: string) {
  return dateKey >= start && dateKey <= end;
}

export function buildCoachInsights({
  meals,
  dailyLogs,
  macroTargets,
  waterTargetMl,
  days,
}: {
  meals: MealSubmission[];
  dailyLogs: DailyLog[];
  macroTargets: MacroTargets;
  waterTargetMl: number;
  days: number;
}): Recommendation[] {
  const { start, end } = getDateWindow(days);
  const approved = meals.filter(
    (meal) =>
      meal.status === 'approved' && inWindow(meal.submittedAt.slice(0, 10), start, end),
  );

  if (approved.length === 0) {
    return [
      {
        id: 'coach-empty',
        title: 'Keep logging',
        body: 'Log a few meals this week to unlock personalized patterns and meal ideas.',
        tone: 'neutral',
      },
    ];
  }

  const insights: Recommendation[] = [];
  const caloriesByType = MEAL_TYPES.reduce<Record<MealTypeId, number>>((acc, type) => {
    acc[type.id] = 0;
    return acc;
  }, {} as Record<MealTypeId, number>);

  let totalCalories = 0;
  const hourBuckets = { morning: 0, afternoon: 0, evening: 0 };

  for (const meal of approved) {
    const kcal = meal.totalNutrition?.caloriesKcal ?? 0;
    totalCalories += kcal;
    caloriesByType[meal.mealType] += kcal;

    const hour = new Date(meal.submittedAt).getHours();
    if (hour < 11) hourBuckets.morning += kcal;
    else if (hour < 17) hourBuckets.afternoon += kcal;
    else hourBuckets.evening += kcal;
  }

  const rankedTypes = Object.entries(caloriesByType)
    .filter(([, kcal]) => kcal > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = rankedTypes[0];
  if (top && totalCalories > 0) {
    const topLabel = MEAL_TYPES.find((t) => t.id === top[0])?.label ?? top[0];
    const topPct = Math.round((top[1] / totalCalories) * 100);
    insights.push({
      id: 'pattern-top-meal',
      title: 'Calorie pattern',
      body:
        topPct >= 45
          ? `About ${topPct}% of your calories this period came from ${topLabel.toLowerCase()} — your heaviest meal window.`
          : `Your calories are spread fairly evenly; ${topLabel.toLowerCase()} leads at ${topPct}%.`,
      tone: topPct >= 50 ? 'warning' : 'neutral',
    });
  }

  const dinnerKcal = caloriesByType.dinner ?? 0;
  const dinnerMeals = approved.filter((m) => m.mealType === 'dinner');
  if (dinnerMeals.length >= 2 && dinnerKcal > 0) {
    const avgDinner = Math.round(dinnerKcal / dinnerMeals.length);
    const dinnerShare = Math.round((dinnerKcal / totalCalories) * 100);
    if (dinnerShare >= 40) {
      insights.push({
        id: 'pattern-dinner-heavy',
        title: 'Dinner focus',
        body: `Most calories land at dinner (~${dinnerShare}%). Average dinner is about ${avgDinner} kcal.`,
        tone: 'tip',
      });
    }
  }

  const breakfastCount = approved.filter((m) => m.mealType === 'breakfast').length;
  const lunchCount = approved.filter((m) => m.mealType === 'lunch').length;
  if (lunchCount + dinnerMeals.length >= 4 && breakfastCount <= 1) {
    insights.push({
      id: 'pattern-skip-breakfast',
      title: 'Breakfast gap',
      body: 'You log lunch and dinner often but rarely breakfast. A morning meal may steady energy and cravings.',
      tone: 'tip',
    });
  }

  const eveningShare = totalCalories > 0 ? Math.round((hourBuckets.evening / totalCalories) * 100) : 0;
  if (eveningShare >= 55) {
    insights.push({
      id: 'pattern-late-calories',
      title: 'Evening calories',
      body: `Roughly ${eveningShare}% of calories were logged after 5 PM this period.`,
      tone: 'warning',
    });
  }

  const windowLogs = dailyLogs.filter((log) => inWindow(log.date, start, end));
  const hydrationHits = windowLogs.filter((log) => log.waterMl >= waterTargetMl).length;
  const hydrationPct = Math.round((hydrationHits / Math.max(1, days)) * 100);
  if (hydrationPct < 50) {
    insights.push({
      id: 'pattern-hydration',
      title: 'Hydration',
      body: `You hit your water goal on ${hydrationPct}% of days in this window. Try logging water with your first meal.`,
      tone: 'tip',
    });
  } else if (hydrationPct >= 70) {
    insights.push({
      id: 'pattern-hydration-good',
      title: 'Hydration streak',
      body: `Strong hydration — ${hydrationPct}% of days met your ${Math.round(waterTargetMl / 1000)}L target.`,
      tone: 'positive',
    });
  }

  const activeDays = new Set(approved.map((m) => m.submittedAt.slice(0, 10))).size;
  const avgProtein =
    approved.reduce((sum, m) => sum + (m.totalNutrition?.proteinG ?? 0), 0) / Math.max(activeDays, 1);
  const proteinDelta = pctOf(avgProtein, macroTargets.proteinG) - 100;
  if (proteinDelta <= -15) {
    insights.push({
      id: 'pattern-protein-low',
      title: 'Protein trend',
      body: `Daily protein averages ${Math.round(avgProtein)}g (${Math.abs(proteinDelta)}% below your ${macroTargets.proteinG}g target).`,
      tone: 'warning',
    });
  }

  const loggedDays = activeDays;
  if (loggedDays < Math.min(days, 7) && days >= 7) {
    insights.push({
      id: 'pattern-consistency',
      title: 'Consistency',
      body: `You logged meals on ${loggedDays} of the last ${days} days. Logging most days improves insight accuracy.`,
      tone: 'neutral',
    });
  }

  return insights.slice(0, 5);
}

export function getTodayApprovedMeals(meals: MealSubmission[], dateKey = todayKey()) {
  return meals.filter(
    (meal) => meal.status === 'approved' && meal.submittedAt.slice(0, 10) === dateKey,
  );
}
