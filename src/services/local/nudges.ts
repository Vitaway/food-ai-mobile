import type { MealSubmission } from '@/types';
import { todayKey, toLocalDateKey } from '@/utils/dates';
import type { NotificationSettings } from '@/services/local/notificationPreferences';
import { isQuietHours } from '@/services/local/notificationPreferences';

export type LocalNudge = {
  id: string;
  readKey: string;
  category: 'meals' | 'hydration' | 'streak';
  title: string;
  message: string;
  createdAt: string;
};

function approvedOnDate(meals: MealSubmission[], dateKey: string) {
  return meals.filter((meal) => meal.status === 'approved' && meal.submittedAt.slice(0, 10) === dateKey);
}

/** Consecutive logged days ending yesterday (today not counted). */
function streakThroughYesterday(meals: MealSubmission[], now = new Date()) {
  const daysWithMeals = new Set(
    meals.filter((meal) => meal.status === 'approved').map((meal) => meal.submittedAt.slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);
  while (daysWithMeals.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function buildLocalNudges({
  meals,
  waterMl,
  waterTargetMl,
  settings,
  now = new Date(),
}: {
  meals: MealSubmission[];
  waterMl: number;
  waterTargetMl: number;
  settings: NotificationSettings;
  now?: Date;
}): LocalNudge[] {
  if (isQuietHours(settings, now)) return [];

  const hour = now.getHours();
  const today = todayKey();
  const approvedToday = approvedOnDate(meals, today);
  const nudges: LocalNudge[] = [];
  const createdAt = now.toISOString();

  if (settings.categories.meals) {
    const hasBreakfast = approvedToday.some((m) => m.mealType === 'breakfast');
    const hasLunch = approvedToday.some((m) => m.mealType === 'lunch');
    const hasDinner = approvedToday.some((m) => m.mealType === 'dinner');

    if (hour >= 10 && hour < 13 && !hasBreakfast) {
      nudges.push({
        id: `nudge:breakfast:${today}`,
        readKey: `nudge:breakfast:${today}`,
        category: 'meals',
        title: 'Breakfast check-in',
        message: "You haven't logged breakfast yet. A quick log keeps your day on track.",
        createdAt,
      });
    }

    if (hour >= 14 && hour < 17 && !hasLunch) {
      nudges.push({
        id: `nudge:lunch:${today}`,
        readKey: `nudge:lunch:${today}`,
        category: 'meals',
        title: 'Lunch reminder',
        message: 'No lunch logged yet. Logging now helps your macro totals stay accurate.',
        createdAt,
      });
    }

    if (hour >= 19 && hour < 23 && !hasDinner) {
      nudges.push({
        id: `nudge:dinner:${today}`,
        readKey: `nudge:dinner:${today}`,
        category: 'meals',
        title: 'Dinner window',
        message: "It's evening and dinner isn't logged. Capture it before the day ends.",
        createdAt,
      });
    }
  }

  if (settings.categories.hydration && hour >= 12 && hour < 20) {
    const waterPct = waterTargetMl > 0 ? Math.round((waterMl / waterTargetMl) * 100) : 0;
    if (waterPct < 45) {
      nudges.push({
        id: `nudge:water:${today}`,
        readKey: `nudge:water:${today}`,
        category: 'hydration',
        title: 'Hydration nudge',
        message: `You're at about ${waterPct}% of today's water goal. Log a glass from your health profile.`,
        createdAt,
      });
    }
  }

  if (settings.categories.streak && hour >= 17) {
    const streak = streakThroughYesterday(meals, now);
    const loggedToday = approvedToday.length > 0;
    if (streak >= 2 && !loggedToday) {
      nudges.push({
        id: `nudge:streak:${today}`,
        readKey: `nudge:streak:${today}`,
        category: 'streak',
        title: 'Streak at risk',
        message: `You're on a ${streak}-day streak. Log any meal today to keep it going.`,
        createdAt,
      });
    }
  }

  return nudges;
}
