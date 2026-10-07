import type { MealSubmission } from '@/types';
import {
  inferPlateGroupFromLabel,
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
  type PlateGroup,
} from '@/types/balancedPlate';
import { getDateWindow, parseDateKey, toLocalDateKey } from '@/utils/dates';
import { sumMealMicronutrients } from '@/utils/mealMicronutrients';

export type StoryTipKind = 'protein' | 'fibre' | 'iron';

export type StoryPlateItem = {
  label: string;
  plateGroup: PlateGroup;
  weightG: number;
};

export type WeeklyStory = {
  hasData: boolean;
  mealsLogged: number;
  activeDays: number;
  windowDays: number;
  /** e.g. "16–22 Sep" */
  rangeLabel: string;
  mostLovedFood: string | null;
  mostLovedCount: number;
  mostLovedPlateItems: StoryPlateItem[];
  proteinThisWeekG: number;
  proteinPriorWeekG: number;
  proteinDeltaG: number;
  avgProteinPerDayG: number;
  avgProteinPriorPerDayG: number;
  /** Percent change in daily avg vs prior; null if prior was 0. */
  proteinDeltaPct: number | null;
  bestPlateScore: number | null;
  bestPlateMealName: string | null;
  bestPlateItems: StoryPlateItem[];
  tipKind: StoryTipKind;
  fibreThisWeekG: number;
  ironThisWeekMg: number;
};

function mealDateKey(meal: MealSubmission) {
  return meal.submittedAt.slice(0, 10);
}

function isStoryMeal(meal: MealSubmission) {
  return meal.status !== 'rejected';
}

function mealsBetween(meals: MealSubmission[], start: string, end: string) {
  return meals.filter((meal) => {
    if (!isStoryMeal(meal)) return false;
    const day = mealDateKey(meal);
    return day >= start && day <= end;
  });
}

function priorWindow(days: number, anchor = new Date()) {
  const thisWeek = getDateWindow(days, anchor);
  const priorEnd = parseDateKey(thisWeek.start);
  priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - (days - 1));
  return { start: toLocalDateKey(priorStart), end: toLocalDateKey(priorEnd) };
}

function formatRangeLabel(startKey: string, endKey: string) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
  if (startMonth === endMonth) return `${startDay}–${endDay} ${endMonth}`;
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

function sumProtein(meals: MealSubmission[]) {
  return meals.reduce((sum, meal) => sum + (meal.totalNutrition?.proteinG ?? 0), 0);
}

function sumFibre(meals: MealSubmission[]) {
  return meals.reduce((sum, meal) => sum + (meal.totalNutrition?.fiberG ?? 0), 0);
}

function sumIron(meals: MealSubmission[]) {
  return meals.reduce((sum, meal) => {
    const micros = sumMealMicronutrients(meal.items ?? []);
    return sum + (micros.ironMg ?? 0) + (micros.mfpIronMg ?? 0);
  }, 0);
}

function mostLoved(meals: MealSubmission[]): { label: string; count: number } | null {
  const counts = new Map<string, number>();
  const seen = new Map<string, string>();
  for (const meal of meals) {
    for (const item of meal.items ?? []) {
      const label = item.label?.trim();
      if (!label || item.estimatedWeightG <= 0) continue;
      const key = label.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (!seen.has(key)) seen.set(key, label);
    }
  }
  let best: { label: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) {
      best = { label: seen.get(key) ?? key, count };
    }
  }
  return best;
}

function toPlateItems(
  items: Array<{ label: string; estimatedWeightG: number; plateGroup?: PlateGroup | null }>,
): StoryPlateItem[] {
  return withInferredPlateGroups(items)
    .filter((item) => item.estimatedWeightG > 0)
    .slice(0, 6)
    .map((item) => ({
      label: item.label,
      plateGroup: item.plateGroup ?? inferPlateGroupFromLabel(item.label),
      weightG: item.estimatedWeightG,
    }));
}

function bestPlate(meals: MealSubmission[]): {
  score: number;
  mealName: string;
  items: StoryPlateItem[];
} | null {
  let best: { score: number; mealName: string; items: StoryPlateItem[] } | null = null;
  for (const meal of meals) {
    const items = withInferredPlateGroups(meal.items ?? []);
    const plate =
      meal.balancedPlate ??
      resolveBalancedPlateForMeal({ mealType: meal.mealType, items });
    if (!plate) continue;
    const name = meal.mealName?.trim() || meal.mealType || 'Meal';
    if (!best || plate.score > best.score) {
      best = { score: plate.score, mealName: name, items: toPlateItems(items) };
    }
  }
  return best;
}

function lovedPlateItems(meals: MealSubmission[], lovedLabel: string | null): StoryPlateItem[] {
  if (!lovedLabel) return [];
  const key = lovedLabel.toLowerCase();
  for (const meal of meals) {
    const hit = (meal.items ?? []).some((item) => item.label?.trim().toLowerCase() === key);
    if (hit && (meal.items?.length ?? 0) > 0) {
      return toPlateItems(meal.items ?? []);
    }
  }
  return [
    {
      label: lovedLabel,
      plateGroup: inferPlateGroupFromLabel(lovedLabel),
      weightG: 150,
    },
  ];
}

function pickTip(opts: {
  avgProtein: number;
  proteinTarget: number;
  fibreTotal: number;
  fibreTarget: number;
  ironMg: number;
  days: number;
}): StoryTipKind {
  const proteinGap = opts.proteinTarget > 0 ? opts.avgProtein / opts.proteinTarget : 1;
  const fibrePerDay = opts.days > 0 ? opts.fibreTotal / opts.days : 0;
  const fibreGap = opts.fibreTarget > 0 ? fibrePerDay / opts.fibreTarget : 1;
  const ironPerDay = opts.days > 0 ? opts.ironMg / opts.days : 0;

  if (proteinGap < 0.85 && proteinGap <= fibreGap) return 'protein';
  if (fibreGap < 0.85) return 'fibre';
  if (ironPerDay < 8) return 'iron';
  if (proteinGap < fibreGap) return 'protein';
  if (fibreGap < 1) return 'fibre';
  return 'iron';
}

export function buildWeeklyStory(
  meals: MealSubmission[],
  opts?: {
    days?: number;
    proteinTargetG?: number;
    fibreTargetG?: number;
    anchor?: Date;
  },
): WeeklyStory {
  const days = opts?.days ?? 7;
  const anchor = opts?.anchor ?? new Date();
  const thisWeek = getDateWindow(days, anchor);
  const prior = priorWindow(days, anchor);
  const current = mealsBetween(meals, thisWeek.start, thisWeek.end);
  const previous = mealsBetween(meals, prior.start, prior.end);

  const activeDays = new Set(current.map(mealDateKey)).size;
  const priorActiveDays = new Set(previous.map(mealDateKey)).size;
  const loved = mostLoved(current);
  const plate = bestPlate(current);
  const proteinThis = Math.round(sumProtein(current) * 10) / 10;
  const proteinPrior = Math.round(sumProtein(previous) * 10) / 10;
  const fibre = Math.round(sumFibre(current) * 10) / 10;
  const iron = Math.round(sumIron(current) * 10) / 10;
  const avgProtein = activeDays > 0 ? proteinThis / activeDays : 0;
  const avgProteinPrior = priorActiveDays > 0 ? proteinPrior / priorActiveDays : 0;
  const proteinDeltaPct =
    avgProteinPrior > 0
      ? Math.round(((avgProtein - avgProteinPrior) / avgProteinPrior) * 100)
      : null;

  return {
    hasData: current.length > 0,
    mealsLogged: current.length,
    activeDays,
    windowDays: days,
    rangeLabel: formatRangeLabel(thisWeek.start, thisWeek.end),
    mostLovedFood: loved?.label ?? null,
    mostLovedCount: loved?.count ?? 0,
    mostLovedPlateItems: lovedPlateItems(current, loved?.label ?? null),
    proteinThisWeekG: proteinThis,
    proteinPriorWeekG: proteinPrior,
    proteinDeltaG: Math.round((proteinThis - proteinPrior) * 10) / 10,
    avgProteinPerDayG: Math.round(avgProtein * 10) / 10,
    avgProteinPriorPerDayG: Math.round(avgProteinPrior * 10) / 10,
    proteinDeltaPct,
    bestPlateScore: plate?.score ?? null,
    bestPlateMealName: plate?.mealName ?? null,
    bestPlateItems: plate?.items ?? [],
    tipKind: pickTip({
      avgProtein,
      proteinTarget: opts?.proteinTargetG ?? 55,
      fibreTotal: fibre,
      fibreTarget: opts?.fibreTargetG ?? 25,
      ironMg: iron,
      days: Math.max(activeDays, 1),
    }),
    fibreThisWeekG: fibre,
    ironThisWeekMg: iron,
  };
}

export function weeklyStoryShareText(
  story: WeeklyStory,
  copy: {
    title: string;
    mealsLine: string;
    lovedLine: string;
    proteinUp: string;
    proteinDown: string;
    proteinFlat: string;
    plateLine: string;
    tipProtein: string;
    tipFibre: string;
    tipIron: string;
    empty: string;
    brand: string;
  },
): string {
  if (!story.hasData) {
    return `${copy.title}\n\n${copy.empty}\n\n${copy.brand}`;
  }

  const loved =
    story.mostLovedFood && story.mostLovedCount > 0
      ? copy.lovedLine
          .replace('{food}', story.mostLovedFood)
          .replace('{n}', String(story.mostLovedCount))
      : null;

  const protein =
    story.proteinDeltaG > 2
      ? copy.proteinUp.replace('{n}', String(Math.abs(Math.round(story.proteinDeltaG))))
      : story.proteinDeltaG < -2
        ? copy.proteinDown.replace('{n}', String(Math.abs(Math.round(story.proteinDeltaG))))
        : copy.proteinFlat;

  const plate =
    story.bestPlateScore != null
      ? copy.plateLine
          .replace('{score}', String(story.bestPlateScore))
          .replace('{meal}', story.bestPlateMealName ?? 'meal')
      : null;

  const tip =
    story.tipKind === 'protein'
      ? copy.tipProtein
      : story.tipKind === 'fibre'
        ? copy.tipFibre
        : copy.tipIron;

  return [
    copy.title,
    '',
    copy.mealsLine
      .replace('{n}', String(story.mealsLogged))
      .replace('{days}', String(story.activeDays)),
    loved,
    protein,
    plate,
    tip,
    '',
    copy.brand,
  ]
    .filter(Boolean)
    .join('\n');
}
