import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { IngredientFlowerChart } from '@/components/log/IngredientFlowerChart';
import { IngredientList } from '@/components/log/IngredientList';
import { LogCard } from '@/components/log/LogScreenShell';
import { RecommendationList } from '@/components/recommendations/RecommendationList';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { services } from '@/services';
import {
  getPostLogRecommendations,
  getTodayApprovedMeals,
} from '@/services/local/recommendations';
import type { MealAnalysisPreview } from '@/types';
import { todayKey } from '@/utils/dates';

type LogResultsStepProps = {
  analysis: MealAnalysisPreview;
  imageUri?: string;
  saving?: boolean;
  onSave: () => void;
};

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800' },
  orange: { bg: 'bg-cinnamon-wood-100', text: 'text-cinnamon-wood-700' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

export function LogResultsStep({ analysis, imageUri, saving, onSave }: LogResultsStepProps) {
  const { meals } = useMeals();
  const { profile } = useProfile();
  const [waterMl, setWaterMl] = useState(0);

  useEffect(() => {
    services.mealsRepository.getDailyLog(todayKey()).then((log) => {
      setWaterMl(log.waterMl);
    });
  }, []);

  const { tips, swaps } = useMemo(() => {
    const targets = profile?.macroTargets ?? {
      calories: 2100,
      proteinG: 140,
      carbsG: 220,
      fatG: 70,
      fiberG: 30,
    };
    return getPostLogRecommendations({
      analysis,
      approvedTodayMeals: getTodayApprovedMeals(meals),
      targets,
      waterMl,
      waterTargetMl: profile?.waterTargetMl ?? 2450,
      goal: profile?.goal ?? 'maintain_weight',
      dietaryPreferences: profile?.dietaryPreferences ?? [],
    });
  }, [analysis, meals, profile, waterMl]);

  const ingredients = analysis.items.map((item) => ({
    id: item.id,
    name: item.label,
    weightG: item.estimatedWeightG,
    emoji: item.emoji ?? '🍽️',
    macros: {
      carbs: `${item.nutrition.carbsG}g`,
      fats: `${item.nutrition.fatG}g`,
      sugar: `${item.nutrition.sugarG ?? 0}g`,
    },
  }));

  const flag = FLAG_STYLES[analysis.healthFlag];

  return (
    <>
      <View className={`rounded-2xl px-4 py-3 ${flag.bg}`}>
        <Text className={`font-sans-semibold text-sm ${flag.text}`}>{analysis.healthMessage}</Text>
      </View>

      <LogCard className="items-center">
        <IngredientFlowerChart imageUri={imageUri} petals={analysis.petals} />
        <Text className="mt-4 font-sans-bold text-2xl text-neutral-900">{analysis.mealName}</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          {analysis.totalWeightG} g · {analysis.totalNutrition.caloriesKcal} kcal
        </Text>
        <View className="mt-3 flex-row gap-4">
          <Text className="text-sm text-neutral-600">P {analysis.totalNutrition.proteinG}g</Text>
          <Text className="text-sm text-neutral-600">C {analysis.totalNutrition.carbsG}g</Text>
          <Text className="text-sm text-neutral-600">F {analysis.totalNutrition.fatG}g</Text>
        </View>
      </LogCard>

      <LogCard>
        <Text className="mb-4 font-sans-semibold text-lg text-neutral-900">Ingredients</Text>
        <IngredientList ingredients={ingredients} />
      </LogCard>

      {tips.length > 0 || swaps.length > 0 ? (
        <LogCard>
          <RecommendationList tips={tips} swaps={swaps} title="Before you submit" />
        </LogCard>
      ) : null}

      <Button
        label={saving ? 'Submitting…' : 'Submit for review'}
        variant="secondary"
        onPress={onSave}
        disabled={saving}
      />
    </>
  );
}
