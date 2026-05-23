import type { MealTypeId } from '@/constants/mealTypes';

export type MealSubmissionStatus =
  | 'pending'
  | 'analyzing'
  | 'in_review'
  | 'approved'
  | 'rejected';

export type HealthGoal = 'lose_weight' | 'maintain_weight' | 'gain_muscle' | 'improve_quality';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface UserProfile {
  id: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goal: HealthGoal;
  activityLevel: ActivityLevel;
  dietaryPreferences: string[];
  macroTargets: MacroTargets;
}

export interface NutritionFacts {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG?: number;
  sodiumMg?: number;
}

export interface DetectedFoodItem {
  id: string;
  label: string;
  confidence: number;
  estimatedWeightG: number;
  nutrition: NutritionFacts;
}

export interface MealSubmission {
  id: string;
  mealType: MealTypeId;
  status: MealSubmissionStatus;
  submittedAt: string;
  imageUrl?: string;
  textInput?: string;
  items?: DetectedFoodItem[];
  totalNutrition?: NutritionFacts;
}

export interface DailyDashboard {
  date: string;
  caloriesConsumed: number;
  calorieTarget: number;
  macros: MacroTargets;
  macrosConsumed: Pick<MacroTargets, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>;
  waterMl: number;
  waterTargetMl: number;
  healthScore: number;
  streakDays: number;
  lastMeal?: MealSubmission;
}
