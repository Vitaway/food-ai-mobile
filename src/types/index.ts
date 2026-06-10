import type { MealTypeId } from '@/constants/mealTypes';

export type MealSubmissionStatus =
  | 'pending'
  | 'analyzing'
  | 'in_review'
  | 'approved'
  | 'rejected';

export type HealthGoal = 'lose_weight' | 'maintain_weight' | 'gain_muscle' | 'improve_quality';

export type GoalPace = 'slow' | 'moderate' | 'aggressive';

export type FraudCheckResult = 'pass' | 'flag' | 'reject';

export type MealClassification = 'meal' | 'snack' | 'beverage' | 'unknown';

export interface CoachReview {
  coachId?: string;
  note?: string;
  reviewedAt?: string;
}

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

export type HealthFlagLevel = 'green' | 'yellow' | 'orange' | 'red';

export type UserSex = 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;

export interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  age: number;
  sex: UserSex;
  heightCm: number;
  weightKg: number;
  goal: HealthGoal;
  activityLevel: ActivityLevel;
  dietaryPreferences: string[];
  targetWeightKg?: number | null;
  goalPace?: GoalPace | null;
  mealsPerDay?: number | null;
  allergies?: string[];
  macroTargets: MacroTargets;
  bmr: number;
  tdee: number;
  waterTargetMl: number;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
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
  emoji?: string;
  nutrition: NutritionFacts;
}

export interface MealPetal {
  label: string;
  percent: number;
  color: string;
}

export interface MealAnalysisPreview {
  mealName: string;
  items: DetectedFoodItem[];
  totalNutrition: NutritionFacts;
  totalWeightG: number;
  confidenceAvg: number;
  petals: MealPetal[];
  healthFlag: HealthFlagLevel;
  healthMessage: string;
  plateDiameterCm?: number | null;
  portionScaleFactor?: number | null;
  portionNote?: string;
}

export interface MealSubmission {
  id: string;
  mealType: MealTypeId;
  status: MealSubmissionStatus;
  submittedAt: string;
  imageUrl?: string;
  textInput?: string;
  note?: string;
  plateDiameterCm?: number | null;
  mealName?: string;
  items?: DetectedFoodItem[];
  totalNutrition?: NutritionFacts;
  confidenceAvg?: number;
  healthFlag?: HealthFlagLevel;
  healthMessage?: string;
  petals?: MealPetal[];
  fraudCheckResult?: FraudCheckResult | null;
  mealClassification?: MealClassification | null;
  modelVersion?: string | null;
  autoApproved?: boolean | null;
  coachReview?: CoachReview | null;
}

export interface DailyLog {
  date: string;
  waterMl: number;
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
