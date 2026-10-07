import type { MealTypeId } from '@/constants/mealTypes';
import type {
  BalancedPlateScore,
  EstimateRange,
  MealLogSource,
  PlateGroup,
} from './balancedPlate';

export type {
  BalancedPlateLabel,
  BalancedPlateScore,
  EstimateRange,
  MealLogSource,
  MealPortionsResponse,
  PlateGroup,
  PlateGroupShares,
  PreviewMealPortionsRequest,
  UpdateMealPortionsRequest,
} from './balancedPlate';

export {
  ESTIMATE_RANGE_PCT,
  PLATE_GROUP_AIM,
  PLATE_GROUP_LABELS,
  computeBalancedPlateScore,
  estimateRangeFromMid,
  inferPlateGroupFromLabel,
  mealTypeSupportsBalancedPlate,
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
} from './balancedPlate';

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
  phone?: string | null;
  avatarUrl?: string;
  dateOfBirth?: string;
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
  clinicalAssessmentStatus?: 'incomplete' | 'draft' | 'confirmed';
  targetStatus?: 'unavailable' | 'provisional' | 'confirmed';
  requiresCoachConfirmation?: boolean;
  nutritionCalculation?: {
    nceVersion: string;
    population: string;
    equationUsed: string;
    goalAdjustmentKcal: number;
    bmi: number;
    safetyFlags: string[];
    warnings: string[];
    calculatedAt: string;
  };
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
  servingUnit?: string;
  servingAmount?: number;
  servingGramsEquivalent?: number;
  nutritionFoodId?: string;
  micronutrients?: Record<string, number>;
  emoji?: string;
  imageUrl?: string;
  nutrition: NutritionFacts;
  /** Balanced Plate group — set by analysis / nutrition-db (Phase 1). */
  plateGroup?: PlateGroup | null;
  /** Optional pin position on plate photo, normalized 0–1 (Phase 3). */
  pin?: { x: number; y: number } | null;
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
  /** How this analysis was produced — drives estimate ± range. */
  logSource?: MealLogSource;
  balancedPlate?: BalancedPlateScore | null;
  estimateRange?: EstimateRange | null;
}

export interface MealSubmission {
  id: string;
  mealType: MealTypeId;
  status: MealSubmissionStatus;
  submittedAt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  textInput?: string;
  note?: string;
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
  logSource?: MealLogSource;
  balancedPlate?: BalancedPlateScore | null;
  estimateRange?: EstimateRange | null;
}

export interface WaterLogEntry {
  id: string;
  amountMl: number;
  cups: number;
  loggedAt: string;
}

export interface DailyLog {
  date: string;
  waterMl: number;
  waterEntries?: WaterLogEntry[];
}

export interface DailyDashboard {
  date: string;
  /** Confirmed + estimate calories (same number shown everywhere). */
  caloriesConsumed: number;
  /** Grace-confirmed portion of today's calories. */
  caloriesConfirmed: number;
  /** Still-estimate portion of today's calories. */
  caloriesEstimate: number;
  calorieTarget: number;
  macros: MacroTargets;
  macrosConsumed: Pick<MacroTargets, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>;
  waterMl: number;
  waterTargetMl: number;
  healthScore: number;
  healthScoreBreakdown?: {
    nutrientScore: number;
    nutrientDataCoverage?: number;
    macroScore: number;
    calorieScore: number;
    consistencyScore: number;
    varietyScore: number;
  };
  streakDays: number;
  lastMeal?: MealSubmission;
}
