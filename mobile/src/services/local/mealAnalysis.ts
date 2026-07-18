import type { MealTypeId } from '@/constants/mealTypes';
import type {
  DetectedFoodItem,
  HealthFlagLevel,
  MealAnalysisPreview,
  MealSubmission,
  MealSubmissionStatus,
  NutritionFacts,
} from '@/types';
import { createId } from '@/utils/dates';
import { isNegligibleCalorieLabel, ZERO_NUTRITION } from '@/utils/negligibleFoodItems';
import { applyPlatePortionScale } from '@/utils/platePortion';
import { sanitizeMealAnalysis } from '@/utils/sanitizeMealAnalysis';

const PHOTO_MEALS = [
  {
    name: 'Tomato Basil Pasta',
    items: [
      { label: 'Pasta', weightG: 180, emoji: '🍝' },
      { label: 'Tomato sauce', weightG: 90, emoji: '🍅' },
      { label: 'Basil', weightG: 10, emoji: '🌿' },
    ],
  },
  {
    name: 'Grilled Chicken Bowl',
    items: [
      { label: 'Chicken breast', weightG: 150, emoji: '🍗' },
      { label: 'Brown rice', weightG: 120, emoji: '🍚' },
      { label: 'Mixed salad', weightG: 80, emoji: '🥗' },
    ],
  },
  {
    name: 'Vegetable Salad Bowl',
    items: [
      { label: 'Tomatoes', weightG: 80, emoji: '🍅' },
      { label: 'Avocado', weightG: 60, emoji: '🥑' },
      { label: 'Spinach', weightG: 45, emoji: '🥬' },
      { label: 'Mixed nuts', weightG: 35, emoji: '🥜' },
    ],
  },
];

function nutritionForItem(label: string, weightG: number): NutritionFacts {
  if (isNegligibleCalorieLabel(label)) {
    return { ...ZERO_NUTRITION };
  }

  const factor = weightG / 100;
  const presets: Record<string, NutritionFacts> = {
    Pasta: { caloriesKcal: 131, proteinG: 5, carbsG: 25, fatG: 1.1, fiberG: 1.8, sugarG: 0.6, sodiumMg: 1 },
    'Tomato sauce': { caloriesKcal: 29, proteinG: 1.3, carbsG: 5.8, fatG: 0.2, fiberG: 1.2, sugarG: 3.9, sodiumMg: 321 },
    Basil: { caloriesKcal: 23, proteinG: 3.2, carbsG: 2.7, fatG: 0.6, fiberG: 1.6, sugarG: 0.3, sodiumMg: 4 },
    'Chicken breast': { caloriesKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0, sugarG: 0, sodiumMg: 74 },
    'Brown rice': { caloriesKcal: 111, proteinG: 2.6, carbsG: 23, fatG: 0.9, fiberG: 1.8, sugarG: 0.4, sodiumMg: 5 },
    'Mixed salad': { caloriesKcal: 20, proteinG: 1.5, carbsG: 3.6, fatG: 0.2, fiberG: 2, sugarG: 1.8, sodiumMg: 15 },
    Tomatoes: { caloriesKcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2, sugarG: 2.6, sodiumMg: 5 },
    Avocado: { caloriesKcal: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7, sugarG: 0.7, sodiumMg: 7 },
    Spinach: { caloriesKcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2, sugarG: 0.4, sodiumMg: 79 },
    'Mixed nuts': { caloriesKcal: 607, proteinG: 20, carbsG: 21, fatG: 54, fiberG: 8, sugarG: 4, sodiumMg: 1 },
  };

  const base = presets[label] ?? { caloriesKcal: 120, proteinG: 4, carbsG: 15, fatG: 4, fiberG: 2, sugarG: 3, sodiumMg: 40 };

  return {
    caloriesKcal: Math.round(base.caloriesKcal * factor),
    proteinG: Math.round(base.proteinG * factor * 10) / 10,
    carbsG: Math.round(base.carbsG * factor * 10) / 10,
    fatG: Math.round(base.fatG * factor * 10) / 10,
    fiberG: Math.round(base.fiberG * factor * 10) / 10,
    sugarG: Math.round((base.sugarG ?? 0) * factor * 10) / 10,
    sodiumMg: Math.round((base.sodiumMg ?? 0) * factor),
  };
}

function sumNutrition(items: DetectedFoodItem[]): NutritionFacts {
  return items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + item.nutrition.caloriesKcal,
      proteinG: acc.proteinG + item.nutrition.proteinG,
      carbsG: acc.carbsG + item.nutrition.carbsG,
      fatG: acc.fatG + item.nutrition.fatG,
      fiberG: acc.fiberG + item.nutrition.fiberG,
      sugarG: (acc.sugarG ?? 0) + (item.nutrition.sugarG ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (item.nutrition.sodiumMg ?? 0),
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 },
  );
}

function buildAnalysis(name: string, rawItems: Array<{ label: string; weightG: number; emoji: string }>, confidence: number) {
  const items: DetectedFoodItem[] = rawItems.map((item) => ({
    id: createId('item'),
    label: item.label,
    confidence: confidence + Math.random() * 0.05,
    estimatedWeightG: item.weightG,
    emoji: item.emoji,
    nutrition: nutritionForItem(item.label, item.weightG),
  }));

  const totalNutrition = sumNutrition(items);
  const totalWeight = items.reduce((sum, item) => sum + item.estimatedWeightG, 0);
  const petals = items.map((item) => ({
    label: item.label,
    percent: Math.round((item.estimatedWeightG / totalWeight) * 100),
    color: '#50af73',
  }));

  const healthFlag: HealthFlagLevel =
    totalNutrition.proteinG >= 25 ? 'green' : totalNutrition.carbsG > 80 ? 'orange' : 'yellow';

  return {
    mealName: name,
    items,
    totalNutrition,
    totalWeightG: totalWeight,
    confidenceAvg: confidence,
    petals,
    healthFlag,
    healthMessage:
      healthFlag === 'green'
        ? 'Well-balanced meal — great choice!'
        : healthFlag === 'orange'
          ? 'High carbohydrate meal — balance your next meal.'
          : 'Good start — consider adding more protein.',
  };
}

export function mockAnalyzePhoto(
  imageUri?: string,
  plateDiameterCm?: number | null,
): MealAnalysisPreview {
  const index = imageUri ? imageUri.length % PHOTO_MEALS.length : 0;
  const meal = PHOTO_MEALS[index];
  const confidence = 0.88 + (index === 0 ? 0.05 : 0);
  const base = buildAnalysis(meal.name, meal.items, confidence);
  return applyPlatePortionScale(base, plateDiameterCm);
}

export function mockAnalyzeText(text: string): MealAnalysisPreview {
  const cleaned = text.trim() || 'Custom meal';

  if (isNegligibleCalorieLabel(cleaned)) {
    return {
      mealName: cleaned,
      items: [
        {
          id: createId('item'),
          label: cleaned,
          confidence: 0.4,
          estimatedWeightG: 0,
          emoji: '🥤',
          nutrition: { ...ZERO_NUTRITION },
        },
      ],
      totalNutrition: { ...ZERO_NUTRITION },
      totalWeightG: 0,
      confidenceAvg: 0.4,
      petals: [{ label: cleaned, percent: 100, color: '#9ca3af' }],
      healthFlag: 'yellow',
      healthMessage: 'No meaningful nutrition — empty container or zero-calorie item.',
    };
  }

  const items = cleaned.split(',').slice(0, 4).map((part, index) => {
    const label = part.trim();
    const negligible = isNegligibleCalorieLabel(label);
    return {
      label,
      weightG: negligible ? 0 : 80 + index * 20,
      emoji: negligible ? '🥤' : '🍽️',
    };
  });

  return buildAnalysis(cleaned, items.length ? items : [{ label: 'Custom meal', weightG: 200, emoji: '🍽️' }], 0.82);
}

/** Local dev mock — when the user adds a description with a photo, honor the text for food identity. */
export function mockAnalyzeMeal(input: {
  imageUri?: string;
  text?: string;
  note?: string;
  plateDiameterCm?: number | null;
}): MealAnalysisPreview {
  if (input.text?.trim()) {
    return sanitizeMealAnalysis(mockAnalyzeText(input.text));
  }

  const description = input.note?.trim();
  if (input.imageUri && description) {
    return sanitizeMealAnalysis(
      applyPlatePortionScale(mockAnalyzeText(description), input.plateDiameterCm),
    );
  }

  if (input.imageUri) {
    return sanitizeMealAnalysis(mockAnalyzePhoto(input.imageUri, input.plateDiameterCm));
  }

  throw new Error('Add a photo or describe your meal');
}

/** Minimal preview when AI cannot analyze — coach reviews photo + description manually. */
export function createCoachReviewStub(description: string): MealAnalysisPreview {
  const cleaned = description.trim() || 'Meal pending review';
  const title = cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
  const emptyNutrition: NutritionFacts = {
    caloriesKcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
  };

  return {
    mealName: title,
    items: [
      {
        id: createId('item'),
        label: cleaned,
        confidence: 0.25,
        estimatedWeightG: 0,
        emoji: '🍽️',
        nutrition: emptyNutrition,
      },
    ],
    totalNutrition: emptyNutrition,
    totalWeightG: 0,
    confidenceAvg: 0.25,
    petals: [{ label: 'Pending review', percent: 100, color: '#9ca3af' }],
    healthFlag: 'yellow',
    healthMessage: 'Your coach will review this meal and confirm nutrition.',
  };
}

type MealSubmissionExtras = Pick<
  MealSubmission,
  | 'fraudCheckResult'
  | 'mealClassification'
  | 'modelVersion'
  | 'autoApproved'
  | 'coachReview'
>;

export function toMealSubmission(
  analysis: MealAnalysisPreview,
  input: {
    mealType: MealTypeId;
    imageUrl?: string;
    textInput?: string;
    note?: string;
    plateDiameterCm?: number | null;
    status?: MealSubmissionStatus;
  } & Partial<MealSubmissionExtras>,
): MealSubmission {
  return {
    id: createId('meal'),
    mealType: input.mealType,
    status: input.status ?? 'in_review',
    submittedAt: new Date().toISOString(),
    imageUrl: input.imageUrl,
    textInput: input.textInput,
    note: input.note,
    plateDiameterCm: input.plateDiameterCm ?? analysis.plateDiameterCm ?? null,
    mealName: analysis.mealName,
    items: analysis.items,
    totalNutrition: analysis.totalNutrition,
    confidenceAvg: analysis.confidenceAvg,
    healthFlag: analysis.healthFlag,
    healthMessage: analysis.healthMessage,
    petals: analysis.petals,
    fraudCheckResult: input.fraudCheckResult ?? null,
    mealClassification: input.mealClassification ?? null,
    modelVersion: input.modelVersion ?? null,
    autoApproved: input.autoApproved ?? null,
    coachReview: input.coachReview ?? null,
  };
}

export function mealSubmissionToAnalysisPreview(meal: MealSubmission): MealAnalysisPreview {
  if (!meal.items?.length || !meal.totalNutrition) {
    throw new Error('Meal is missing analysis fields');
  }

  const mealName =
    meal.mealName?.trim() ||
    meal.textInput?.trim() ||
    meal.items.map((item) => item.label).join(', ') ||
    'Repeated meal';

  return {
    mealName,
    items: meal.items,
    totalNutrition: meal.totalNutrition,
    totalWeightG: meal.items.reduce((sum, item) => sum + item.estimatedWeightG, 0),
    confidenceAvg: meal.confidenceAvg ?? 0.85,
    petals: meal.petals ?? [],
    healthFlag: meal.healthFlag ?? 'yellow',
    healthMessage: meal.healthMessage ?? 'Analysis complete.',
    plateDiameterCm: meal.plateDiameterCm ?? null,
  };
}

/** Clone a past meal into a fresh analysis preview for re-logging. */
export function analysisPreviewFromPastMeal(meal: MealSubmission): MealAnalysisPreview {
  const preview = mealSubmissionToAnalysisPreview(meal);
  return {
    ...preview,
    items: preview.items.map((item) => ({
      ...item,
      id: createId('item'),
      nutrition: { ...item.nutrition },
    })),
    totalNutrition: { ...preview.totalNutrition },
    petals: preview.petals.map((petal) => ({ ...petal })),
  };
}
