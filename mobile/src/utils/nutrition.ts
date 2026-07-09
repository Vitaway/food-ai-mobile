import type { ActivityLevel, HealthGoal, MacroTargets, UserSex } from '@/types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export function resolveSexForCalculation(sex: UserSex): 'male' | 'female' {
  if (sex === 'male') return 'male';
  if (sex === 'female') return 'female';
  return 'female';
}

export function calculateBmr(weightKg: number, heightCm: number, age: number, sex: UserSex) {
  const resolved = resolveSexForCalculation(sex);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'other' || sex === 'prefer_not_to_say' || sex === null) {
    const male = base + 5;
    const female = base - 161;
    return Math.round((male + female) / 2);
  }
  return Math.round(resolved === 'male' ? base + 5 : base - 161);
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel) {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

function goalCalorieAdjustment(goal: HealthGoal) {
  if (goal === 'lose_weight') return -500;
  if (goal === 'gain_muscle') return 300;
  return 0;
}

export function calculateMacroTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: UserSex,
  activityLevel: ActivityLevel,
  goal: HealthGoal,
): { bmr: number; tdee: number; macroTargets: MacroTargets } {
  const bmr = calculateBmr(weightKg, heightCm, age, sex);
  const tdee = calculateTdee(bmr, activityLevel);
  const calories = Math.max(1200, tdee + goalCalorieAdjustment(goal));

  const proteinG = Math.round(goal === 'gain_muscle' ? weightKg * 2 : weightKg * 1.6);
  const proteinCalories = proteinG * 4;
  const fatG = Math.round((calories * 0.28) / 9);
  const fatCalories = fatG * 9;
  const carbsG = Math.max(0, Math.round((calories - proteinCalories - fatCalories) / 4));
  const resolved = resolveSexForCalculation(sex);
  const fiberG = resolved === 'female' ? 25 : 38;

  return {
    bmr,
    tdee,
    macroTargets: { calories, proteinG, carbsG, fatG, fiberG },
  };
}

export function calculateWaterTargetMl(weightKg: number) {
  return Math.round(weightKg * 35);
}

export function getHealthFlagLevel(value: number, target: number, type: 'max' | 'min' = 'max') {
  const ratio = type === 'max' ? value / target : target / Math.max(value, 1);
  if (ratio <= 1) return 'green';
  if (ratio <= 1.15) return 'yellow';
  if (ratio <= 1.3) return 'orange';
  return 'red';
}
