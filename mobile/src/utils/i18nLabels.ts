import type { MealTypeId } from '@/constants/mealTypes';
import type { TranslationTree } from '@/i18n/en';
import type { HealthScoreBand } from '@/utils/healthScore';
import { toWholeGlasses } from '@/utils/waterUnits';

export function glassNounFromT(t: TranslationTree, glasses: number): string {
  return toWholeGlasses(glasses) === 1 ? t.common.glass : t.common.glasses;
}

export function formatGlassesShortFromT(t: TranslationTree, glasses: number): string {
  return `${toWholeGlasses(glasses)} ${glassNounFromT(t, glasses)}`;
}

export function healthBandLabel(t: TranslationTree, band: HealthScoreBand): string {
  switch (band) {
    case 'needs_attention':
      return t.health.needsAttention;
    case 'fair':
      return t.health.fair;
    case 'good':
      return t.health.good;
    case 'great':
      return t.health.great;
  }
}

export function macroLabel(
  t: TranslationTree,
  id: 'protein' | 'carbs' | 'fat' | 'fiber',
): string {
  return t.macros[id];
}

export function mealTypeLabelFromT(t: TranslationTree, mealType: string): string {
  switch (mealType as MealTypeId) {
    case 'breakfast':
      return t.log.breakfast;
    case 'lunch':
      return t.log.lunch;
    case 'dinner':
      return t.log.dinner;
    case 'mid_morning_snack':
      return t.log.midMorning;
    case 'afternoon_snack':
      return t.log.afternoon;
    case 'evening_snack':
      return t.log.evening;
    case 'pre_workout':
      return t.log.preWorkout;
    case 'post_workout':
      return t.log.postWorkout;
    default:
      return t.common.meal;
  }
}

export function coachingFeedTypeLabel(
  t: TranslationTree,
  type: 'tip' | 'celebration' | 'reminder' | 'coach_note' | 'trend',
): string {
  switch (type) {
    case 'tip':
      return t.home.feedTip;
    case 'celebration':
      return t.home.feedWin;
    case 'reminder':
      return t.home.feedReminder;
    case 'coach_note':
      return t.home.feedCoach;
    case 'trend':
      return t.home.feedInsight;
  }
}
