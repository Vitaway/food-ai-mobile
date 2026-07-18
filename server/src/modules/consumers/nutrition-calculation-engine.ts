export const NCE_VERSION = "2026-07-clinical-v1";

export type CalculationSex = "male" | "female" | "other" | "prefer_not_to_say" | null;
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";
export type HealthGoal =
  | "lose_weight"
  | "maintain_weight"
  | "maintain"
  | "gain_muscle"
  | "improve_quality"
  | "improve_diet_quality";
export type GoalPace = "slow" | "moderate" | "aggressive" | null;
export type AssessmentStatus = "incomplete" | "draft" | "confirmed";
export type NutritionPopulation = "adult" | "pregnant_singleton" | "pregnant_twins" | "lactating" | "pediatric";

export type NutritionCalculationInput = {
  age: number;
  sex: CalculationSex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  goalPace?: GoalPace;
  assessmentStatus?: AssessmentStatus;
  pregnant?: boolean;
  trimester?: 1 | 2 | 3 | null;
  numberOfBabies?: 1 | 2 | null;
  prePregnancyWeightKg?: number | null;
  lactating?: boolean;
  conditions?: string[];
  fluidRestriction?: boolean;
  coachAllowsProtectedWeightLoss?: boolean;
};

export type NutritionCalculationResult = {
  nceVersion: string;
  population: NutritionPopulation;
  equationUsed: string;
  targetStatus: "provisional" | "confirmed";
  requiresCoachConfirmation: boolean;
  bmr: number;
  tdee: number;
  calorieTarget: number;
  goalAdjustmentKcal: number;
  macroTargets: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  waterTargetMl: number;
  bmi: number;
  safetyFlags: string[];
  warnings: string[];
  calculatedAt: string;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const CLINICAL_CONFIRM_CONDITIONS = new Set([
  "diabetes",
  "kidney_disease",
  "heart_disease",
  "hypertension",
  "eating_disorder",
]);

function assertRange(name: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}

function adultBmr(weightKg: number, heightCm: number, age: number, sex: CalculationSex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return { value: base + 5, equation: "mifflin_st_jeor_male" };
  if (sex === "female") return { value: base - 161, equation: "mifflin_st_jeor_female" };
  return {
    value: ((base + 5) + (base - 161)) / 2,
    equation: "mifflin_st_jeor_sex_average",
  };
}

function pediatricSchofield(weightKg: number, age: number, sex: CalculationSex) {
  const boy =
    age < 3
      ? 59.512 * weightKg - 30.4
      : age < 10
        ? 22.706 * weightKg + 504.3
        : 17.686 * weightKg + 658.2;
  const girl =
    age < 3
      ? 58.317 * weightKg - 31.05
      : age < 10
        ? 20.315 * weightKg + 485.9
        : 13.384 * weightKg + 692.6;

  if (sex === "male") return { value: boy, equation: "schofield_boy_weight_based" };
  if (sex === "female") return { value: girl, equation: "schofield_girl_weight_based" };
  return {
    value: (boy + girl) / 2,
    equation: "schofield_sex_average_weight_based",
  };
}

function goalAdjustment(goal: HealthGoal, pace: GoalPace | undefined) {
  if (goal === "lose_weight") {
    if (pace === "aggressive") return -750;
    if (pace === "moderate") return -625;
    return -500;
  }
  if (goal === "gain_muscle") {
    if (pace === "aggressive") return 500;
    if (pace === "moderate") return 400;
    return 300;
  }
  return 0;
}

function pregnancyAddition(trimester: 1 | 2 | 3 | null | undefined, twins: boolean) {
  if (!trimester || trimester === 1) return 0;
  if (twins) return 685;
  return trimester === 2 ? 340 : 452;
}

function normalizedConditions(conditions: string[] | undefined) {
  return new Set((conditions ?? []).map((condition) => condition.trim().toLowerCase().replace(/\s+/g, "_")));
}

export function canCalculateNutritionTargets(
  profile: Record<string, unknown>,
): profile is Record<string, unknown> & NutritionCalculationInput {
  const activityLevels: readonly string[] = Object.keys(ACTIVITY_MULTIPLIERS);
  const goals: readonly string[] = [
    "lose_weight",
    "maintain_weight",
    "maintain",
    "gain_muscle",
    "improve_quality",
    "improve_diet_quality",
  ];
  return (
    typeof profile.age === "number" &&
    typeof profile.heightCm === "number" &&
    typeof profile.weightKg === "number" &&
    typeof profile.activityLevel === "string" &&
    activityLevels.includes(profile.activityLevel) &&
    typeof profile.goal === "string" &&
    goals.includes(profile.goal)
  );
}

/**
 * Authoritative clinical target calculation.
 *
 * Patient-provided basics may produce provisional targets. Only a confirmed
 * coach assessment can produce confirmed targets, and protected populations
 * never receive an automatic calorie deficit.
 */
export function calculateNutritionTargets(
  input: NutritionCalculationInput,
  now = new Date(),
): NutritionCalculationResult {
  assertRange("age", input.age, 0, 120);
  assertRange("heightCm", input.heightCm, 45, 250);
  assertRange("weightKg", input.weightKg, 2, 400);

  const safetyFlags: string[] = [];
  const warnings: string[] = [];
  const assessmentConfirmed = input.assessmentStatus === "confirmed";
  const conditions = normalizedConditions(input.conditions);
  const requiresIndividualizedTargets =
    input.fluidRestriction === true ||
    conditions.has("kidney_disease") ||
    conditions.has("heart_disease") ||
    conditions.has("eating_disorder");
  const bmi = input.weightKg / ((input.heightCm / 100) ** 2);

  if (input.sex !== "male" && input.sex !== "female") {
    safetyFlags.push("calculation_sex_unconfirmed");
    warnings.push("Sex used by the clinical equation must be verified by a coach.");
  }
  if (bmi > 40) {
    safetyFlags.push("bmi_over_40_coach_review");
    warnings.push("BMI over 40 requires coach review; Mifflin-St Jeor continues to use actual weight.");
  }
  for (const condition of conditions) {
    if (CLINICAL_CONFIRM_CONDITIONS.has(condition)) {
      safetyFlags.push(`condition_${condition}`);
    }
  }
  if (input.fluidRestriction || conditions.has("kidney_disease") || conditions.has("heart_disease")) {
    safetyFlags.push("hydration_requires_clinical_review");
    warnings.push("The calculated water target must not override a prescribed fluid restriction.");
  }
  if (requiresIndividualizedTargets) {
    warnings.push(
      "Automated macro and hydration targets remain provisional until individualized clinical targets are recorded.",
    );
  }

  let population: NutritionPopulation;
  let bmr: number;
  let tdee: number;
  let equationUsed: string;
  let protectedFromAutomaticLoss = false;

  if (input.age < 18) {
    const pediatric = pediatricSchofield(input.weightKg, input.age, input.sex);
    population = "pediatric";
    bmr = pediatric.value;
    tdee = pediatric.value;
    equationUsed = pediatric.equation;
    protectedFromAutomaticLoss = true;
    safetyFlags.push("pediatric_review_required");
    warnings.push("Pediatric activity factors are not applied until a validated pediatric reference is approved.");
  } else if (input.pregnant) {
    const pregnancyWeight = input.prePregnancyWeightKg;
    if (!pregnancyWeight) {
      safetyFlags.push("missing_pre_pregnancy_weight");
      warnings.push("Pre-pregnancy weight is required for a confirmed pregnancy target.");
    }
    const base = adultBmr(pregnancyWeight ?? input.weightKg, input.heightCm, input.age, input.sex);
    const twins = input.numberOfBabies === 2;
    population = twins ? "pregnant_twins" : "pregnant_singleton";
    bmr = base.value;
    tdee =
      bmr * ACTIVITY_MULTIPLIERS[input.activityLevel] +
      pregnancyAddition(input.trimester, twins);
    equationUsed = `${base.equation}_pregnancy_${twins ? "twins" : "singleton"}`;
    protectedFromAutomaticLoss = true;
    if (!input.trimester) safetyFlags.push("missing_pregnancy_trimester");
  } else if (input.lactating) {
    const base = adultBmr(input.weightKg, input.heightCm, input.age, input.sex);
    population = "lactating";
    bmr = base.value;
    tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel] + 500;
    equationUsed = `${base.equation}_lactation_plus_500`;
    protectedFromAutomaticLoss = true;
  } else {
    const adult = adultBmr(input.weightKg, input.heightCm, input.age, input.sex);
    population = "adult";
    bmr = adult.value;
    tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
    equationUsed = adult.equation;
  }

  let adjustment = assessmentConfirmed ? goalAdjustment(input.goal, input.goalPace) : 0;
  if (
    adjustment < 0 &&
    protectedFromAutomaticLoss &&
    !input.coachAllowsProtectedWeightLoss
  ) {
    adjustment = 0;
    safetyFlags.push("automatic_weight_loss_blocked");
    warnings.push("Automatic weight-loss deficits are blocked for this population.");
  }

  const alwaysProvisional =
    !assessmentConfirmed ||
    safetyFlags.includes("pediatric_review_required") ||
    safetyFlags.includes("missing_pre_pregnancy_weight") ||
    safetyFlags.includes("missing_pregnancy_trimester") ||
    safetyFlags.includes("calculation_sex_unconfirmed") ||
    requiresIndividualizedTargets;

  const calorieTarget = Math.max(0, Math.round(tdee + adjustment));
  const proteinG = Math.round(input.weightKg * (input.goal === "gain_muscle" ? 2 : 1.6));
  const fatG = Math.round((calorieTarget * 0.28) / 9);
  const carbsG = Math.max(0, Math.round((calorieTarget - proteinG * 4 - fatG * 9) / 4));
  const fiberG = input.sex === "male" ? 38 : 25;

  return {
    nceVersion: NCE_VERSION,
    population,
    equationUsed,
    targetStatus: alwaysProvisional ? "provisional" : "confirmed",
    requiresCoachConfirmation: alwaysProvisional,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    goalAdjustmentKcal: adjustment,
    macroTargets: {
      calories: calorieTarget,
      proteinG,
      carbsG,
      fatG,
      fiberG,
    },
    waterTargetMl: Math.round(input.weightKg * 35),
    bmi: Math.round(bmi * 10) / 10,
    safetyFlags: [...new Set(safetyFlags)],
    warnings,
    calculatedAt: now.toISOString(),
  };
}
