import type {
  DetectedFoodItem,
  FraudCheckResult,
  HealthFlagLevel,
  MacroTargets,
  MealClassification,
  MealPetal,
  MealSubmission,
  NutritionFacts,
  CoachReview,
} from '@/types';

export type CoachQueueMeal = MealSubmission & {
  clientId?: string;

  // Server-provided meal metadata (queue-specific + analysis-specific)
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  confidenceAvg?: number | undefined;
  healthFlag?: HealthFlagLevel | string | undefined;
  healthMessage?: string | undefined;
  petals?: MealPetal[] | unknown;
  fraudCheckResult?: FraudCheckResult | string | null | undefined;
  mealClassification?: MealClassification | string | null | undefined;
  modelVersion?: string | null | undefined;
  autoApproved?: boolean | null | undefined;
  manualReviewRequired?: boolean;
  manualReviewReason?: string | null;

  // Coach queue fields
  waitingMinutes?: number | null;
  complexity?: string;
  classificationLabel?: string;
  queueIsPicked?: boolean;
  queueNeedsPickup?: boolean;
  queuePickedByCoachId?: string | null;
  queuePickedByCoachName?: string | null;

  // Allergen / SLA info derived by the server
  hasAllergies?: boolean;
  clientHasAllergies?: boolean;
  allergenMatch?: boolean;
  possibleAllergenMatch?: boolean;
  matchedAllergens?: string[];
  possibleAllergens?: string[];
  isProPriority?: boolean;

  // Coach-specific fields
  coachReview?: CoachReview | null;
};

export type CoachQueueClient = {
  patientId?: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    allergies?: string[];
    macroTargets?: MacroTargets;
  };
  inReviewCount?: number;
  lastMealAt?: string | null;
  unreadMessages?: number;

  // For richer client workspace screens (summary/detail/insights)
  dashboard?: unknown;
  adherenceTrend?: 'improving' | 'stable' | 'declining' | string;
  openFlags?: number;
  membershipTier?: 'standard' | 'pro' | string;
  cohortIds?: string[];
  hasAllergies?: boolean;
  clientHasAllergies?: boolean;
};

export type CoachQueueItem = {
  meal: CoachQueueMeal;
  client: CoachQueueClient;
};

export type CoachMealReviewHistoryEntry = {
  coachId?: string | null;
  note?: string | null;
  reviewedAt?: string | null;
  action?: 'approve' | 'reject';
};

export type CoachMealDetail = CoachQueueItem & {
  recentMeals?: CoachQueueMeal[];
  reviewHistory?: CoachMealReviewHistoryEntry[];
};

export type CoachProfile = {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  avatarUrl?: string;
  organization?: string | null;

  // Extra fields we can expose for editing
  bio?: string | null;
  phone?: string | null;
  timezone?: string | null;
};

export type ReviewMealPayload = {
  action: 'approve' | 'reject';
  note?: string;
  mealName?: string;
};

export type CoachClientWeeklySummary = {
  clientId: string;
  weekStart: string; // YYYY-MM-DD
  daysLogged: number;
  mealsSubmitted: number;
  approvedCount: number;
  rejectedCount: number;
  avgDailyCalories: number;
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  targets: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  adherenceRate: number; // percent
};

export type ClinicalAssessmentBasics = {
  age: number | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  heightCm: number | null;
  weightKg: number | null;

  goal: string | null;
  goalPace: 'slow' | 'moderate' | 'aggressive' | null;
  targetWeightKg: number | null;
  activityLevel: string | null;
  mealsPerDay: number | null;

  dietaryPreferences: string[];
  allergies: string[];
};

export type ClinicalAssessmentDto = {
  clientId: string;
  status: 'incomplete' | 'draft' | 'confirmed';
  data: Record<string, unknown>;
  targetSnapshot: Record<string, unknown> | null;
  lastEditedBy: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  updatedAt: string | null;
  patientBasics: ClinicalAssessmentBasics;
};

export type ClinicalAssessmentSavePayload = {
  // Core verified basics
  verifiedDateOfBirth?: string; // YYYY-MM-DD
  verifiedAge?: number; // deprecated legacy
  verifiedSex?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  verifiedHeightCm?: number;
  verifiedWeightKg?: number;

  // Pregnancy / lactation
  pregnant?: boolean;
  trimester?: 1 | 2 | 3 | null;
  numberOfBabies?: 1 | 2 | null;
  prePregnancyWeightKg?: number | null;
  lactating?: boolean;

  // Conditions & safety
  conditions?: string[];
  conditionDetails?: Record<string, unknown>;
  fluidRestriction?: boolean;
  occupation?: string;
  exercise?: Record<string, unknown>;
  smoking?: Record<string, unknown>;
  alcohol?: Record<string, unknown>;

  // Lifestyle & coaching notes
  sleepHours?: number;
  stressLevel?: 'low' | 'moderate' | 'high';
  coachNotes?: string;

  // Targets / coach override
  goal?: string;
  goalPace?: 'slow' | 'moderate' | 'aggressive';
  targetWeightKg?: number | null;
  activityLevel?: string;
  mealsPerDay?: number | null;
  dietaryPreferences?: string[];
  allergies?: string[];
};

export type ClinicalAssessmentConfirmPayload = {
  allowProtectedWeightLoss?: boolean;
  confirmationNote?: string;
};

export type CoachInsightType = 'tip' | 'celebration' | 'reminder' | 'coach_note' | 'trend';

export type CoachInsight = {
  id: string;
  coachUserId: string;
  clientId: string;
  type: CoachInsightType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ReviewDraft = {
  mealId: string;
  mealName?: string;
  items: DetectedFoodItem[];
  note?: string;
  trainingNote?: string;
  updatedAt: string;
} | null;

export type SaveReviewDraftPayload = {
  mealName?: string;
  items?: DetectedFoodItem[] | unknown[];
  note?: string;
  trainingNote?: string;
};

export type CoachAIAssistDraft = {
  mealId: string;
  mealName?: string;
  items: DetectedFoodItem[];
  note: string;
  trainingNote: string;
};

export type CoachAIAssistMealResponse = {
  mealId: string;
  mealName?: string;
  items: DetectedFoodItem[];
  totalNutrition: NutritionFacts | Record<string, number>;
  draft: CoachAIAssistDraft;
};

export type ReviewTask = {
  id: string;
  mealId: string;
  type: 'second_opinion' | 'escalation';
  status: 'open' | 'resolved';
  note: string | null;
  notifyUser: boolean;
  requesterCoachId: string;
  assigneeCoachId: string | null;
  createdAt: string;
};

export type CreateReviewTaskPayload = {
  type: 'second_opinion' | 'escalation';
  note?: string;
  notifyUser?: boolean;
  assigneeUserId?: string;
  notifyChannel?: 'team' | 'assignee' | 'both';
};

export type CoachTeamMember = {
  coachUserId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  role?: 'coach' | 'admin' | 'nutrition_coach' | string;
  title?: string | null;
  isSelf?: boolean;
};

export type CoachTeamResponse = {
  coaches: CoachTeamMember[];
};

export type CoachProfileUpdatePayload = {
  displayName?: string;
  title?: string | null;
  organization?: string | null;
  bio?: string | null;
  phone?: string | null;
  timezone?: string | null;
  avatarUrl?: string | null;
};

export type CoachPasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
};

export type CoachStats = {
  inReview: number;
  analyzing: number;
  approvedToday: number;
  flagged: number;
  avgReviewMinutes: number;
  waitingOverHour: number;
  inactiveClients: number;
  unreadMessages: number;
};

export type SmartCoachAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  clientId: string;
  clientName: string;
  message: string;
  category: 'adherence' | 'nutrition' | 'hydration' | 'health_score';
};
