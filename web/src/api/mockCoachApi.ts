import type { CoachClient, CoachDashboardStats, CoachQueueItem, MealSubmission } from '@/types';

const CLIENTS: CoachClient[] = [
  {
    profile: {
      id: 'client_1',
      displayName: 'Peter Opara',
      email: 'peter@example.com',
      age: 28,
      sex: 'male',
      heightCm: 178,
      weightKg: 82,
      goal: 'lose_weight',
      activityLevel: 'moderately_active',
      dietaryPreferences: ['high_protein'],
      allergies: ['peanuts'],
      macroTargets: { calories: 2444, proteinG: 160, carbsG: 260, fatG: 72, fiberG: 30 },
      bmr: 1820,
      tdee: 2444,
      waterTargetMl: 2800,
      onboardingComplete: true,
    },
    dashboard: {
      date: new Date().toISOString().slice(0, 10),
      caloriesConsumed: 1240,
      calorieTarget: 2444,
      macrosConsumed: { proteinG: 62, carbsG: 148, fatG: 38, fiberG: 12 },
      waterMl: 750,
      waterTargetMl: 2800,
      healthScore: 78,
      streakDays: 3,
    },
  },
  {
    profile: {
      id: 'client_2',
      displayName: 'Amara Nwosu',
      email: 'amara@example.com',
      age: 34,
      sex: 'female',
      heightCm: 165,
      weightKg: 68,
      goal: 'gain_muscle',
      activityLevel: 'very_active',
      dietaryPreferences: ['vegetarian'],
      allergies: [],
      macroTargets: { calories: 2680, proteinG: 145, carbsG: 310, fatG: 78, fiberG: 35 },
      bmr: 1480,
      tdee: 2680,
      waterTargetMl: 3000,
      onboardingComplete: true,
    },
    dashboard: {
      date: new Date().toISOString().slice(0, 10),
      caloriesConsumed: 1890,
      calorieTarget: 2680,
      macrosConsumed: { proteinG: 98, carbsG: 210, fatG: 54, fiberG: 22 },
      waterMl: 2100,
      waterTargetMl: 3000,
      healthScore: 85,
      streakDays: 12,
    },
  },
  {
    profile: {
      id: 'client_3',
      displayName: 'James Okonkwo',
      email: 'james@example.com',
      age: 41,
      sex: 'male',
      heightCm: 182,
      weightKg: 91,
      goal: 'improve_quality',
      activityLevel: 'lightly_active',
      dietaryPreferences: [],
      allergies: ['shellfish'],
      macroTargets: { calories: 2200, proteinG: 130, carbsG: 240, fatG: 68, fiberG: 28 },
      bmr: 1750,
      tdee: 2200,
      waterTargetMl: 2600,
      onboardingComplete: true,
    },
    dashboard: {
      date: new Date().toISOString().slice(0, 10),
      caloriesConsumed: 860,
      calorieTarget: 2200,
      macrosConsumed: { proteinG: 34, carbsG: 92, fatG: 28, fiberG: 8 },
      waterMl: 500,
      waterTargetMl: 2600,
      healthScore: 62,
      streakDays: 1,
    },
  },
];

let mealsDb: MealSubmission[] = [
  {
    id: 'meal_001',
    clientId: 'client_1',
    mealType: 'lunch',
    status: 'in_review',
    submittedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    mealName: 'Grilled Chicken Bowl',
    note: 'Homemade, olive oil dressing',
    plateDiameterCm: 26,
    confidenceAvg: 0.91,
    healthFlag: 'green',
    healthMessage: 'Well-balanced meal — great protein ratio',
    fraudCheckResult: 'pass',
    mealClassification: 'meal',
    modelVersion: 'mock-api-v1',
    totalNutrition: { caloriesKcal: 520, proteinG: 42, carbsG: 48, fatG: 16, fiberG: 6 },
    petals: [
      { label: 'Protein', percent: 42, color: '#1d9e75' },
      { label: 'Carbs', percent: 38, color: '#023459' },
      { label: 'Fat', percent: 20, color: '#ff6f32' },
    ],
    items: [
      {
        id: 'i1',
        label: 'Chicken breast',
        confidence: 0.94,
        estimatedWeightG: 150,
        emoji: '🍗',
        nutrition: { caloriesKcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, fiberG: 0 },
      },
      {
        id: 'i2',
        label: 'Brown rice',
        confidence: 0.88,
        estimatedWeightG: 120,
        emoji: '🍚',
        nutrition: { caloriesKcal: 132, proteinG: 2.8, carbsG: 28, fatG: 1.1, fiberG: 2 },
      },
      {
        id: 'i3',
        label: 'Mixed greens',
        confidence: 0.85,
        estimatedWeightG: 80,
        emoji: '🥗',
        nutrition: { caloriesKcal: 28, proteinG: 2, carbsG: 4, fatG: 0.5, fiberG: 2 },
      },
    ],
  },
  {
    id: 'meal_002',
    clientId: 'client_2',
    mealType: 'breakfast',
    status: 'in_review',
    submittedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    mealName: 'Avocado Toast & Eggs',
    confidenceAvg: 0.76,
    healthFlag: 'yellow',
    healthMessage: 'Good start — carbs a bit high for morning',
    fraudCheckResult: 'flag',
    mealClassification: 'meal',
    modelVersion: 'mock-api-v1',
    totalNutrition: { caloriesKcal: 410, proteinG: 18, carbsG: 42, fatG: 20, fiberG: 8 },
    items: [
      {
        id: 'i4',
        label: 'Sourdough bread',
        confidence: 0.82,
        estimatedWeightG: 60,
        emoji: '🍞',
        nutrition: { caloriesKcal: 160, proteinG: 5, carbsG: 30, fatG: 2, fiberG: 2 },
      },
      {
        id: 'i5',
        label: 'Avocado',
        confidence: 0.9,
        estimatedWeightG: 80,
        emoji: '🥑',
        nutrition: { caloriesKcal: 128, proteinG: 2, carbsG: 7, fatG: 12, fiberG: 5 },
      },
    ],
  },
  {
    id: 'meal_003',
    clientId: 'client_3',
    mealType: 'dinner',
    status: 'in_review',
    submittedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    mealName: 'Margherita Pizza (2 slices)',
    note: 'Restaurant meal',
    confidenceAvg: 0.68,
    healthFlag: 'orange',
    healthMessage: 'High carb & fat — portion may be underestimated',
    fraudCheckResult: 'flag',
    mealClassification: 'meal',
    modelVersion: 'mock-api-v1',
    totalNutrition: { caloriesKcal: 680, proteinG: 24, carbsG: 82, fatG: 28, fiberG: 4 },
    items: [
      {
        id: 'i6',
        label: 'Pizza slice',
        confidence: 0.72,
        estimatedWeightG: 200,
        emoji: '🍕',
        nutrition: { caloriesKcal: 560, proteinG: 20, carbsG: 68, fatG: 22, fiberG: 3 },
      },
    ],
  },
  {
    id: 'meal_004',
    clientId: 'client_1',
    mealType: 'breakfast',
    status: 'analyzing',
    submittedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1494859802809-d0cdec177a01?w=800&q=80',
    mealName: 'Analyzing…',
    confidenceAvg: 0,
    healthFlag: 'green',
    healthMessage: '',
    fraudCheckResult: 'pass',
    mealClassification: 'unknown',
    modelVersion: 'mock-api-v1',
  },
  {
    id: 'meal_005',
    clientId: 'client_2',
    mealType: 'lunch',
    status: 'approved',
    submittedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    mealName: 'Quinoa Buddha Bowl',
    confidenceAvg: 0.93,
    healthFlag: 'green',
    healthMessage: 'Excellent macro balance',
    fraudCheckResult: 'pass',
    coachReview: { coachId: 'coach_1', reviewedAt: new Date(Date.now() - 3 * 3600000).toISOString() },
    totalNutrition: { caloriesKcal: 480, proteinG: 22, carbsG: 58, fatG: 18, fiberG: 12 },
  },
];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function clientFor(id: string) {
  const found = CLIENTS.find((c) => c.profile.id === id);
  if (!found) throw new Error(`Client ${id} not found`);
  return found;
}

export async function fetchCoachStats(): Promise<CoachDashboardStats> {
  await delay(300);
  const inReview = mealsDb.filter((m) => m.status === 'in_review').length;
  const analyzing = mealsDb.filter((m) => m.status === 'analyzing').length;
  const flagged = mealsDb.filter((m) => m.fraudCheckResult === 'flag' && m.status === 'in_review').length;
  const approvedToday = mealsDb.filter((m) => m.status === 'approved').length;
  return { inReview, analyzing, approvedToday, flagged, avgReviewMinutes: 4.2 };
}

export async function fetchCoachQueue(): Promise<CoachQueueItem[]> {
  await delay(400);
  return mealsDb
    .filter((m) => m.status === 'in_review')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map((meal) => ({ meal, client: clientFor(meal.clientId) }));
}

export async function fetchMealById(id: string): Promise<CoachQueueItem | null> {
  await delay(250);
  const meal = mealsDb.find((m) => m.id === id);
  if (!meal) return null;
  return { meal, client: clientFor(meal.clientId) };
}

export async function fetchClients(): Promise<CoachClient[]> {
  await delay(300);
  return CLIENTS;
}

export async function reviewMeal(payload: {
  mealId: string;
  action: 'approve' | 'reject';
  note?: string;
  items?: MealSubmission['items'];
  mealName?: string;
}): Promise<MealSubmission> {
  await delay(500);
  const idx = mealsDb.findIndex((m) => m.id === payload.mealId);
  if (idx === -1) throw new Error('Meal not found');

  const updated: MealSubmission = {
    ...mealsDb[idx],
    status: payload.action === 'approve' ? 'approved' : 'rejected',
    mealName: payload.mealName ?? mealsDb[idx].mealName,
    items: payload.items ?? mealsDb[idx].items,
    coachReview: {
      coachId: 'coach_1',
      note: payload.note,
      reviewedAt: new Date().toISOString(),
    },
  };
  mealsDb = [...mealsDb.slice(0, idx), updated, ...mealsDb.slice(idx + 1)];
  return updated;
}
