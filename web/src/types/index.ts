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
  id?: string;
  coachId?: string;
  note?: string;
  trainingNote?: string;
  reviewedAt?: string;
  action?: 'approve' | 'reject';
  mealName?: string;
  items?: DetectedFoodItem[];
  totalNutrition?: NutritionFacts;
  reviewDurationSeconds?: number;
}

export interface AiAnalysis {
  mealName?: string;
  items: DetectedFoodItem[];
  totalNutrition?: NutritionFacts;
  confidenceAvg?: number;
  healthFlag?: HealthFlagLevel;
  healthMessage?: string;
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
  servingUnit?: string;
  servingAmount?: number;
  servingGramsEquivalent?: number;
  foodSource?: 'ai' | 'nutrition_db' | 'manual';
  /** Linked nutrition_foods row when foodSource is nutrition_db. */
  nutritionFoodId?: string;
  /** Per-100g macros from DB — used to rescale weight accurately. */
  nutritionPer100g?: NutritionFacts;
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
  dateOfBirth?: string;
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
  adminNotes?: string;
  goalPace?: string;
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
  manualReviewRequired?: boolean | null;
  manualReviewReason?: string | null;
  aiAnalysis?: AiAnalysis;
  coachReview?: CoachReview | null;
  waitingMinutes?: number;
  slaLevel?: 'ok' | 'warning' | 'critical';
  slaMinutesRemaining?: number;
  complexity?: 'low' | 'medium' | 'high';
  classificationLabel?: string;
  hasAllergies?: boolean;
  clientHasAllergies?: boolean;
  allergenMatch?: boolean;
  possibleAllergenMatch?: boolean;
  matchedAllergens?: string[];
  possibleAllergens?: string[];
  isProPriority?: boolean;
  queuePickedByCoachId?: string;
  queuePickedByCoachName?: string;
  queuePickedAt?: string;
  queueEscalatedAt?: string;
  queueIsPicked?: boolean;
  queueNeedsPickup?: boolean;
}

export interface CoachClient {
  patientId: string;
  profile: UserProfile;
  dashboard: DailyDashboard;
  lastMealAt?: string | null;
  inReviewCount?: number;
  cohortIds?: string[];
  unreadMessages?: number;
  adherenceTrend?: 'improving' | 'stable' | 'declining';
  openFlags?: number;
  hasAllergies?: boolean;
  clientHasAllergies?: boolean;
  membershipTier?: 'standard' | 'pro';
}

export interface CoachClientDetail {
  client: CoachClient;
  meals: MealSubmission[];
  assignedCoachIds: string[];
}

export interface CoachWeeklySummary {
  clientId: string;
  weekStart: string;
  daysLogged: number;
  mealsSubmitted: number;
  approvedCount: number;
  rejectedCount: number;
  avgDailyCalories: number;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  targets: { calories: number; proteinG: number; carbsG: number; fatG: number };
  adherenceRate: number;
}

export interface CoachCohort {
  id: string;
  name: string;
  organization?: string | null;
  description?: string | null;
  memberCount: number;
}

export interface CoachTeamMember {
  coachUserId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  role?: 'coach' | 'admin';
  title?: string | null;
  approvedToday: number;
  totalReviews: number;
  avgReviewMinutes: number;
  caseload: number;
  isSelf: boolean;
}

export interface CoachMessage {
  id: string;
  senderRole: 'coach' | 'consumer';
  body: string;
  mealId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface CoachMealDetail extends CoachQueueItem {
  recentMeals: MealSubmission[];
  reviewHistory: CoachReview[];
}

export interface CoachQueueItem {
  meal: MealSubmission;
  client: CoachClient;
}

export interface CoachPastReviewItem extends CoachQueueItem {
  review: CoachReview;
}

export interface CoachDashboardStats {
  inReview: number;
  analyzing: number;
  approvedToday: number;
  flagged: number;
  avgReviewMinutes: number;
  waitingOverHour?: number;
  inactiveClients?: number;
  unreadMessages?: number;
}

export interface ReviewMealPayload {
  mealId: string;
  action: 'approve' | 'reject';
  note?: string;
  trainingNote?: string;
  items?: DetectedFoodItem[];
  mealName?: string;
}

export interface CoachOperationsMetrics {
  correctionRate: number;
  autoApprovalRateToday: number;
  autoApprovalRateWeek: number;
  avgTurnaroundHours: number;
  pendingReview: number;
  nearSla: number;
  slaOnTrack: boolean;
}

export interface CoachReviewDraft {
  mealId: string;
  mealName?: string;
  items: DetectedFoodItem[];
  note?: string;
  trainingNote?: string;
  updatedAt?: string;
}

export interface MealReviewTask {
  id: string;
  mealId: string;
  type: 'second_opinion' | 'escalation';
  status: 'open' | 'resolved';
  note?: string | null;
  notifyUser?: boolean;
  assigneeUserId?: string | null;
  assigneeCoachId?: string | null;
  createdAt: string;
}

export interface AdminOperationsMetrics {
  activeUsers: number;
  activeUsersGrowth: number;
  autoApprovalRate: number;
  correctionRate: number;
  avgTurnaroundHours: number;
  slaTargetHours: number;
  coachUtilization: Array<{
    coachId: string;
    displayName: string;
    email: string;
    assignedClients: number;
    queueCount: number;
    utilization: number;
    title: string | null;
  }>;
  autoApprovalTrend: Array<{ label: string; rate: number; approved: number }>;
  consumers: number;
  mealsInReview: number;
}

export interface AdminCoachRosterRow {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  role: string;
  assignedClients: number;
  correctionRate: number;
  avgTurnaroundHours: number;
  organization: string | null;
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
