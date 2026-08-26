import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';

import { CompactMealTypePicker } from '@/components/log/CompactMealTypePicker';
import { IngredientList } from '@/components/log/IngredientList';
import { MealAiBreakdown } from '@/components/log/MealAiBreakdown';
import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import { semanticColors, palette } from '@/design-system/colors';
import type { MealTypeId } from '@/constants/mealTypes';
import type { MealAnalysisPreview } from '@/types';
import { formatMacroG } from '@/utils/formatMacro';
import { applyServingUnitToItem, recalculateAnalysisTotals, SERVING_UNITS } from '@/utils/servingUnits';

type LogResultsStepProps = {
  analysis: MealAnalysisPreview;
  onAnalysisChange: (next: MealAnalysisPreview) => void;
  imageUri?: string;
  selectedMealType: MealTypeId | null;
  onSelectMealType: (id: MealTypeId) => void;
  /** Coach-first stub — no provisional macros to edit. */
  awaitingCoachConfirm?: boolean;
};

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-100', text: 'text-shamrock-800' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800' },
  orange: { bg: 'bg-cinnamon-wood-100', text: 'text-cinnamon-wood-700' },
  red: { bg: 'bg-red-100', text: 'text-red-800' },
} as const;

function MealHeroPreview({
  imageUri,
  mealName,
  subtitle,
}: {
  imageUri?: string;
  mealName: string;
  subtitle: string;
}) {
  const navy = palette['blue-spruce'];

  return (
    <View
      className="overflow-hidden rounded-[28px] bg-white"
      style={{
        shadowColor: navy[900],
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}>
      <View className="relative h-[168px] bg-ash-grey-100">
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[navy[100], navy[50], '#f7f8f5']}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-5xl">🍽️</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(2, 52, 89, 0.72)']}
          locations={[0.35, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 }}
        />
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <Text className="font-sans-bold text-[22px] leading-7 text-white" numberOfLines={2}>
            {mealName}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Text className="text-[13px] text-white/85">{subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function LogResultsStep({
  analysis,
  onAnalysisChange,
  imageUri,
  selectedMealType,
  onSelectMealType,
  awaitingCoachConfirm = false,
}: LogResultsStepProps) {
  const flag = FLAG_STYLES[analysis.healthFlag];
  const showNutrition = !awaitingCoachConfirm && analysis.totalNutrition.caloriesKcal > 0;
  const navy = palette['blue-spruce'];

  const ingredients = analysis.items.map((item) => ({
    id: item.id,
    name: item.label,
    weightG: item.estimatedWeightG,
    servingUnit: item.servingUnit ?? 'g',
    servingAmount: item.servingAmount ?? 1,
    emoji: item.emoji ?? '🍽️',
    macros: {
      carbs: formatMacroG(item.nutrition.carbsG),
      fats: formatMacroG(item.nutrition.fatG),
      sugar: formatMacroG(item.nutrition.sugarG ?? 0),
    },
  }));

  const macroSummary = [
    { label: 'Protein', value: formatMacroG(analysis.totalNutrition.proteinG), color: '#1D9E75' },
    { label: 'Carbs', value: formatMacroG(analysis.totalNutrition.carbsG), color: '#023459' },
    { label: 'Fat', value: formatMacroG(analysis.totalNutrition.fatG), color: semanticColors.accentOrange },
  ];

  if (awaitingCoachConfirm) {
    return (
      <>
        <MealHeroPreview
          imageUri={imageUri}
          mealName={analysis.mealName}
          subtitle="Coach will confirm nutrition after you submit"
        />

        <View
          className="flex-row items-start gap-3 rounded-2xl px-3.5 py-3"
          style={{ backgroundColor: navy[50] }}>
          <View
            className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: navy[100] }}>
            <Ionicons name="sparkles-outline" size={16} color={navy[700]} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-[13px] text-blue-spruce-900">
              Almost there
            </Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-blue-spruce-700">
              Pick a meal type below, then submit. Your coach reviews the photo and note.
            </Text>
          </View>
        </View>

        <View
          className="rounded-[24px] bg-white px-4 py-4"
          style={{
            borderWidth: 1,
            borderColor: selectedMealType ? palette['cinnamon-wood'][200] : palette['ash-grey'][100],
            shadowColor: navy[900],
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}>
          <CompactMealTypePicker selected={selectedMealType} onSelect={onSelectMealType} />
          {!selectedMealType ? (
            <Text className="mt-3 text-center text-[12px] text-cinnamon-wood-600">
              Select a meal type to enable submit
            </Text>
          ) : (
            <View className="mt-3 flex-row items-center justify-center gap-1.5">
              <Ionicons name="checkmark-circle" size={16} color={palette.shamrock[500]} />
              <Text className="text-[12px] font-sans-semibold text-shamrock-700">
                Ready to submit
              </Text>
            </View>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <MealHeroPreview
        imageUri={imageUri}
        mealName={analysis.mealName}
        subtitle={
          showNutrition
            ? `${analysis.totalWeightG} g · ${analysis.totalNutrition.caloriesKcal} kcal`
            : 'Review details, then submit'
        }
      />

      <View className={`rounded-2xl px-4 py-3 ${flag.bg}`}>
        <Text className={`font-sans-semibold text-sm ${flag.text}`}>{analysis.healthMessage}</Text>
      </View>

      {showNutrition ? (
        <View className="flex-row gap-2">
          {macroSummary.map((macro) => (
            <View key={macro.label} className="flex-1 rounded-2xl bg-white px-3 py-2.5">
              <Text className="text-xs text-neutral-500">{macro.label}</Text>
              <Text className="mt-0.5 font-sans-bold text-base" style={{ color: macro.color }}>
                {macro.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View
        className="rounded-[24px] bg-white px-4 py-4"
        style={{
          borderWidth: 1,
          borderColor: selectedMealType ? palette['cinnamon-wood'][200] : palette['ash-grey'][100],
        }}>
        <CompactMealTypePicker selected={selectedMealType} onSelect={onSelectMealType} />
        {!selectedMealType ? (
          <Text className="mt-3 text-center text-[12px] text-cinnamon-wood-600">
            Select a meal type to enable submit
          </Text>
        ) : null}
      </View>

      {showNutrition ? <MealAiBreakdown analysis={analysis} /> : null}

      {ingredients.length > 0 && showNutrition ? (
        <LogCard>
          <Text className="mb-3 font-sans-semibold text-base text-neutral-900">Ingredients</Text>
          <IngredientList
            ingredients={ingredients}
            onCycleServingUnit={(ingredientId) => {
              const nextItems = analysis.items.map((item) => {
                if (item.id !== ingredientId) return item;
                const current = item.servingUnit ?? 'g';
                const idx = SERVING_UNITS.indexOf(current as (typeof SERVING_UNITS)[number]);
                const next = SERVING_UNITS[(idx + 1) % SERVING_UNITS.length];
                return applyServingUnitToItem(item, next, item.servingAmount ?? 1);
              });
              const totals = recalculateAnalysisTotals(nextItems);
              onAnalysisChange({ ...analysis, items: nextItems, ...totals });
            }}
            onAdjustServingAmount={(ingredientId, delta) => {
              const nextItems = analysis.items.map((item) => {
                if (item.id !== ingredientId) return item;
                const amount = Math.max(0.5, (item.servingAmount ?? 1) + delta);
                return applyServingUnitToItem(item, item.servingUnit ?? 'g', amount);
              });
              const totals = recalculateAnalysisTotals(nextItems);
              onAnalysisChange({ ...analysis, items: nextItems, ...totals });
            }}
          />
        </LogCard>
      ) : null}
    </>
  );
}
