import {
  calculateNutritionTargets,
  canCalculateNutritionTargets,
  type AssessmentStatus,
  type NutritionCalculationInput,
  type NutritionCalculationResult,
} from "./nutrition-calculation-engine";
import { ageFromDateOfBirth, isValidDateOfBirth } from "./date-of-birth.util";

function numberOr(value: unknown, fallback: unknown) {
  return typeof value === "number" ? value : fallback;
}

function stringOr(value: unknown, fallback: unknown) {
  return typeof value === "string" ? value : fallback;
}

/** Coach-verified values override patient-entered basics without deleting the patient's answers. */
export function mergedCalculationProfile(
  profile: Record<string, unknown>,
  assessmentData: Record<string, unknown> = {},
): Record<string, unknown> {
  const dateOfBirth =
    typeof assessmentData.verifiedDateOfBirth === "string"
      ? assessmentData.verifiedDateOfBirth
      : profile.dateOfBirth;
  const derivedAge = isValidDateOfBirth(dateOfBirth)
    ? ageFromDateOfBirth(dateOfBirth)
    : numberOr(assessmentData.verifiedAge, profile.age);
  return {
    ...profile,
    dateOfBirth,
    age: derivedAge,
    sex: stringOr(assessmentData.verifiedSex, profile.sex),
    heightCm: numberOr(assessmentData.verifiedHeightCm, profile.heightCm),
    weightKg: numberOr(assessmentData.verifiedWeightKg, profile.weightKg),
    ...assessmentData,
  };
}

export function calculateTargetsForProfile(
  profile: Record<string, unknown>,
  assessmentData: Record<string, unknown> = {},
  assessmentStatus: AssessmentStatus = "incomplete",
  allowProtectedWeightLoss = false,
): NutritionCalculationResult | null {
  const source = mergedCalculationProfile(profile, assessmentData);
  if (!canCalculateNutritionTargets(source)) return null;

  const input: NutritionCalculationInput = {
    age: source.age,
    sex:
      source.sex === "male" ||
      source.sex === "female" ||
      source.sex === "other" ||
      source.sex === "prefer_not_to_say" ||
      source.sex === null
        ? source.sex
        : null,
    heightCm: source.heightCm,
    weightKg: source.weightKg,
    activityLevel: source.activityLevel,
    goal: source.goal,
    goalPace:
      source.goalPace === "slow" ||
      source.goalPace === "moderate" ||
      source.goalPace === "aggressive"
        ? source.goalPace
        : null,
    assessmentStatus,
    pregnant: source.pregnant === true,
    trimester:
      source.trimester === 1 || source.trimester === 2 || source.trimester === 3
        ? source.trimester
        : null,
    numberOfBabies: source.numberOfBabies === 1 || source.numberOfBabies === 2
      ? source.numberOfBabies
      : null,
    prePregnancyWeightKg:
      typeof source.prePregnancyWeightKg === "number" ? source.prePregnancyWeightKg : null,
    lactating: source.lactating === true,
    conditions: Array.isArray(source.conditions)
      ? source.conditions.filter((condition): condition is string => typeof condition === "string")
      : [],
    fluidRestriction: source.fluidRestriction === true,
    coachAllowsProtectedWeightLoss: allowProtectedWeightLoss,
  };

  return calculateNutritionTargets(input);
}

export function profileWithCalculatedTargets(
  profile: Record<string, unknown>,
  result: NutritionCalculationResult | null,
  assessmentStatus: AssessmentStatus,
) {
  if (!result) {
    return {
      ...profile,
      clinicalAssessmentStatus: assessmentStatus,
      targetStatus: "unavailable",
      requiresCoachConfirmation: true,
    };
  }

  return {
    ...profile,
    bmr: result.bmr,
    tdee: result.tdee,
    macroTargets: result.macroTargets,
    waterTargetMl: result.waterTargetMl,
    clinicalAssessmentStatus: assessmentStatus,
    targetStatus: result.targetStatus,
    requiresCoachConfirmation: result.requiresCoachConfirmation,
    nutritionCalculation: {
      nceVersion: result.nceVersion,
      population: result.population,
      equationUsed: result.equationUsed,
      goalAdjustmentKcal: result.goalAdjustmentKcal,
      bmi: result.bmi,
      safetyFlags: result.safetyFlags,
      warnings: result.warnings,
      calculatedAt: result.calculatedAt,
    },
  };
}
