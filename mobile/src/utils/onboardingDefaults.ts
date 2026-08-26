import type { HealthGoal, UserSex } from '@/types';

/** Adult height (cm) guess from age + sex. */
export function guessHeightCm(age: number, sex: UserSex): number {
  const base =
    sex === 'male' ? 175 : sex === 'female' ? 162 : 168;
  // Slight taper after mid-adulthood; teens a bit shorter than peak adult.
  let height = base;
  if (age < 18) height = base - 4;
  else if (age >= 50 && age < 65) height = base - 1;
  else if (age >= 65) height = base - 3;
  return Math.round(Math.min(200, Math.max(140, height)));
}

/** Healthy average weight (kg) from height + age band. */
export function guessWeightKg(age: number, sex: UserSex, heightCm?: number): number {
  const height = heightCm ?? guessHeightCm(age, sex);
  // Target BMI ~22–23; males slightly higher lean mass.
  const bmi = sex === 'male' ? 23.2 : sex === 'female' ? 22.0 : 22.5;
  let weight = bmi * (height / 100) ** 2;
  if (age >= 50) weight += 1.5;
  if (age >= 65) weight += 1;
  return Math.round(Math.min(140, Math.max(42, weight)) * 2) / 2;
}

/** Suggest target weight from current weight + goal. */
export function guessTargetWeightKg(opts: {
  weightKg: number;
  goal: HealthGoal;
  age: number;
  sex: UserSex;
}): number {
  const { weightKg, goal, age, sex } = opts;
  const delta =
    sex === 'male' ? 1 : sex === 'female' ? 0.85 : 0.9;

  let target = weightKg;
  switch (goal) {
    case 'lose_weight':
      target = weightKg - Math.max(3, Math.min(8, 5 * delta));
      break;
    case 'gain_muscle':
      target = weightKg + Math.max(3, Math.min(7, 4.5 * delta + (age < 30 ? 1 : 0)));
      break;
    case 'maintain_weight':
    case 'improve_quality':
    default:
      target = weightKg;
      break;
  }

  return Math.round(Math.min(180, Math.max(40, target)) * 2) / 2;
}

export type OnboardingFillInput = {
  displayName: string;
  dateOfBirthValid: boolean;
  sex: UserSex;
  heightCm: number;
  weightKg: number;
  goal: HealthGoal | null;
  targetWeightKg: number;
  activityLevel: string | null;
  mealsPerDay: number;
};

/** Progress from filled profile fields (not step index). Prefer onboardingStepPercent. */
export function onboardingFillPercent(input: OnboardingFillInput): number {
  const checks = [
    input.displayName.trim().length >= 2,
    input.dateOfBirthValid,
    input.sex !== null,
    input.dateOfBirthValid && input.heightCm >= 120 && input.heightCm <= 230,
    input.dateOfBirthValid && input.weightKg >= 35 && input.weightKg <= 250,
    Boolean(input.goal),
    input.dateOfBirthValid && input.targetWeightKg >= 35 && input.targetWeightKg <= 250,
    Boolean(input.activityLevel),
    input.mealsPerDay >= 1 && input.mealsPerDay <= 6,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
