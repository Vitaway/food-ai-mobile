import type { HealthGoal } from '@/types';

export type MealSwapSuggestion = {
  id: string;
  title: string;
  description: string;
  caloriesKcal: number;
  proteinG: number;
  goals: HealthGoal[];
  /** Hide when the user has any of these dietary preferences */
  incompatibleWith?: string[];
};

export const MEAL_SWAP_SUGGESTIONS: MealSwapSuggestion[] = [
  {
    id: 'greek-yogurt-berries',
    title: 'Greek yogurt & berries',
    description: 'High protein, filling, ~180 kcal',
    caloriesKcal: 180,
    proteinG: 17,
    goals: ['lose_weight', 'maintain_weight', 'gain_muscle', 'improve_quality'],
    incompatibleWith: ['Vegan', 'Dairy-free'],
  },
  {
    id: 'grilled-chicken-salad',
    title: 'Grilled chicken salad',
    description: 'Lean protein with greens, ~320 kcal',
    caloriesKcal: 320,
    proteinG: 35,
    goals: ['lose_weight', 'maintain_weight', 'gain_muscle'],
    incompatibleWith: ['Vegetarian', 'Vegan'],
  },
  {
    id: 'lentil-bowl',
    title: 'Lentil & veggie bowl',
    description: 'Plant protein and fiber, ~380 kcal',
    caloriesKcal: 380,
    proteinG: 18,
    goals: ['lose_weight', 'maintain_weight', 'improve_quality'],
    incompatibleWith: [],
  },
  {
    id: 'tuna-avocado-wrap',
    title: 'Tuna avocado wrap',
    description: 'Omega-3s and healthy fats, ~410 kcal',
    caloriesKcal: 410,
    proteinG: 28,
    goals: ['maintain_weight', 'gain_muscle'],
    incompatibleWith: ['Vegetarian', 'Vegan'],
  },
  {
    id: 'overnight-oats',
    title: 'Overnight oats',
    description: 'Slow carbs for steady energy, ~290 kcal',
    caloriesKcal: 290,
    proteinG: 12,
    goals: ['maintain_weight', 'gain_muscle', 'improve_quality'],
    incompatibleWith: ['Gluten-free'],
  },
  {
    id: 'tofu-stir-fry',
    title: 'Tofu stir-fry',
    description: 'Low saturated fat, ~340 kcal',
    caloriesKcal: 340,
    proteinG: 22,
    goals: ['lose_weight', 'improve_quality'],
    incompatibleWith: [],
  },
  {
    id: 'egg-white-omelette',
    title: 'Egg white omelette',
    description: 'Light breakfast protein, ~220 kcal',
    caloriesKcal: 220,
    proteinG: 24,
    goals: ['lose_weight', 'maintain_weight'],
    incompatibleWith: ['Vegan'],
  },
  {
    id: 'hummus-veggie-plate',
    title: 'Hummus & veggie plate',
    description: 'Fiber-rich snack, ~250 kcal',
    caloriesKcal: 250,
    proteinG: 9,
    goals: ['lose_weight', 'improve_quality'],
    incompatibleWith: ['Low-carb'],
  },
  {
    id: 'salmon-quinoa',
    title: 'Salmon with quinoa',
    description: 'Balanced dinner plate, ~480 kcal',
    caloriesKcal: 480,
    proteinG: 38,
    goals: ['gain_muscle', 'maintain_weight', 'improve_quality'],
    incompatibleWith: ['Vegetarian', 'Vegan'],
  },
  {
    id: 'cottage-cheese-fruit',
    title: 'Cottage cheese & fruit',
    description: 'Casein protein before bed, ~200 kcal',
    caloriesKcal: 200,
    proteinG: 20,
    goals: ['gain_muscle', 'lose_weight'],
    incompatibleWith: ['Vegan', 'Dairy-free'],
  },
];
