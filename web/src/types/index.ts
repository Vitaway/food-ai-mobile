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
export type FraudCheckResult = 'pass' | 'flag' | 'reject';
export type MealClassification = 'meal' | 'snack' | 'beverage' | 'unknown';
export type HealthFlagLevel = 'green' | 'yellow' | 'orange' | 'red';
export type MealTypeId =
  | 'breakfast'
  | 'mid_morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack'
  | 'pre_workout'
  | 'post_workout';

export interface CoachReview {
  coachId?: string;
  note?: string;
  reviewedAt?: string;
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
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

export interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  age: number;
  sex: string | null;
  heightCm: number;
  weightKg: number;
  goal: HealthGoal;
  activityLevel: ActivityLevel;
  dietaryPreferences: string[];
  allergies?: string[];
  macroTargets: MacroTargets;
  bmr: number;
  tdee: number;
  waterTargetMl: number;
  onboardingComplete: boolean;
}

export interface DailyDashboard {
  date: string;
  caloriesConsumed: number;
  calorieTarget: number;
  macrosConsumed: Pick<MacroTargets, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>;
  waterMl: number;
  waterTargetMl: number;
  healthScore: number;
  streakDays: number;
}

export interface MealSubmission {
  id: string;
  clientId: string;
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

export interface CoachClient {
  patientId: string;
  profile: UserProfile;
  dashboard: DailyDashboard;
}

export interface CoachQueueItem {
  meal: MealSubmission;
  client: CoachClient;
}

export interface CoachDashboardStats {
  inReview: number;
  analyzing: number;
  approvedToday: number;
  flagged: number;
  avgReviewMinutes: number;
}

export interface ReviewMealPayload {
  mealId: string;
  action: 'approve' | 'reject';
  note?: string;
  items?: DetectedFoodItem[];
  mealName?: string;
}

export interface CoachProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  bio?: string;
  timezone: string;
  avatarUrl?: string;
  memberSince: string;
}

export interface UpdateCoachProfilePayload {
  displayName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  bio?: string;
  timezone: string;
  avatarUrl?: string;
}

export interface UpdateCoachPasswordPayload {
  currentPassword: string;
  newPassword: string;
}
