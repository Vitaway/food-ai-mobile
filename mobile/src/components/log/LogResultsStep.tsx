import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';

import { CompactMealTypePicker } from '@/components/log/CompactMealTypePicker';
import { Text } from '@/components/ui/Text';
import { semanticColors, palette } from '@/design-system/colors';
import type { MealTypeId } from '@/constants/mealTypes';
import { useI18n } from '@/context/LocaleContext';
import type { DetectedFoodItem, MealAnalysisPreview } from '@/types';
import { formatMacroG } from '@/utils/formatMacro';
import { formatServingLabel } from '@/utils/servingUnits';

type LogResultsStepProps = {
  analysis: MealAnalysisPreview;
  imageUri?: string;
  selectedMealType: MealTypeId | null;
  onSelectMealType: (id: MealTypeId) => void;
  /** Coach-first stub — no provisional macros to edit. */
  awaitingCoachConfirm?: boolean;
};

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-50', text: 'text-shamrock-800', icon: 'leaf-outline' as const },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'alert-circle-outline' as const },
  orange: { bg: 'bg-cinnamon-wood-50', text: 'text-cinnamon-wood-700', icon: 'warning-outline' as const },
  red: { bg: 'bg-red-50', text: 'text-red-800', icon: 'alert-outline' as const },
} as const;

function servingText(item: DetectedFoodItem): string {
  if (item.servingUnit && item.servingAmount != null && item.servingAmount > 0) {
    return formatServingLabel(item.servingAmount, item.servingUnit);
  }
  return formatServingLabel(item.estimatedWeightG, 'g');
}

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
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      }}>
      <View className="relative h-[196px] bg-ash-grey-100">
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[navy[200], navy[50], '#f7f8f5']}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-5xl">🍽️</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(2, 52, 89, 0.82)']}
          locations={[0.28, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 118 }}
        />
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <Text className="font-sans-bold text-[24px] leading-8 text-white" numberOfLines={2}>
            {mealName}
          </Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.9)" />
            <Text className="text-[13px] text-white/90">{subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MealTypeCard({
  selected,
  onSelect,
}: {
  selected: MealTypeId | null;
  onSelect: (id: MealTypeId) => void;
}) {
  const { t } = useI18n();
  const navy = palette['blue-spruce'];

  return (
    <View
      className="rounded-[24px] bg-white px-4 py-4"
      style={{
        borderWidth: 1,
        borderColor: selected ? palette['cinnamon-wood'][200] : palette['ash-grey'][100],
        shadowColor: navy[900],
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}>
      <CompactMealTypePicker selected={selected} onSelect={onSelect} />
      {!selected ? (
        <Text className="mt-3 text-center text-[12px] text-cinnamon-wood-600">{t.log.selectMealType}</Text>
      ) : (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          <Ionicons name="checkmark-circle" size={16} color={palette.shamrock[500]} />
          <Text className="text-[12px] font-sans-semibold text-shamrock-700">{t.log.readyToSubmit}</Text>
        </View>
      )}
    </View>
  );
}

export function LogResultsStep({
  analysis,
  imageUri,
  selectedMealType,
  onSelectMealType,
  awaitingCoachConfirm = false,
}: LogResultsStepProps) {
  const { t } = useI18n();
  const flag = FLAG_STYLES[analysis.healthFlag];
  const showNutrition = !awaitingCoachConfirm && analysis.totalNutrition.caloriesKcal > 0;
  const showItems = !awaitingCoachConfirm && analysis.items.length > 0;
  const navy = palette['blue-spruce'];

  const macros = [
    { label: 'Protein', value: formatMacroG(analysis.totalNutrition.proteinG), color: '#1D9E75' },
    { label: 'Carbs', value: formatMacroG(analysis.totalNutrition.carbsG), color: navy[700] },
    { label: 'Fat', value: formatMacroG(analysis.totalNutrition.fatG), color: semanticColors.accentOrange },
  ];

  if (awaitingCoachConfirm) {
    return (
      <>
        <MealHeroPreview
          imageUri={imageUri}
          mealName={analysis.mealName}
          subtitle={t.log.coachConfirmSubtitle}
        />

        <View className="flex-row items-start gap-3 rounded-2xl px-3.5 py-3" style={{ backgroundColor: navy[50] }}>
          <View
            className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: navy[100] }}>
            <Ionicons name="sparkles-outline" size={16} color={navy[700]} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-[13px] text-blue-spruce-900">{t.log.almostThere}</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-blue-spruce-700">{t.log.almostThereBody}</Text>
          </View>
        </View>

        <MealTypeCard selected={selectedMealType} onSelect={onSelectMealType} />
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
            ? `${analysis.totalNutrition.caloriesKcal} kcal`
            : t.log.readyToSubmit
        }
      />

      {showNutrition ? (
        <View
          className="overflow-hidden rounded-[28px] bg-white px-5 py-5"
          style={{
            shadowColor: navy[900],
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}>
          <Text className="text-xs font-sans-semibold uppercase tracking-wide text-ash-grey-400">
            {t.log.reviewCalories}
          </Text>
          <View className="mt-1 flex-row items-end gap-1">
            <Text className="font-sans-bold text-[40px] leading-[44px] text-blue-spruce-900">
              {analysis.totalNutrition.caloriesKcal}
            </Text>
            <Text className="mb-1.5 text-base font-sans-semibold text-ash-grey-500">kcal</Text>
          </View>

          <View className="mt-4 flex-row gap-2">
            {macros.map((macro) => (
              <View key={macro.label} className="flex-1 rounded-2xl bg-ash-grey-50 px-3 py-3">
                <Text className="text-[11px] text-neutral-500">{macro.label}</Text>
                <Text className="mt-0.5 font-sans-bold text-[17px]" style={{ color: macro.color }}>
                  {macro.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {showItems ? (
        <View
          className="rounded-[28px] bg-white px-4 py-4"
          style={{
            shadowColor: navy[900],
            shadowOpacity: 0.05,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 5 },
            elevation: 2,
          }}>
          <View className="mb-3 flex-row items-center justify-between px-1">
            <Text className="font-sans-bold text-base text-neutral-900">{t.log.reviewInThisMeal}</Text>
            <Text className="text-xs text-ash-grey-400">{analysis.items.length}</Text>
          </View>
          <View className="gap-2.5">
            {analysis.items.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center gap-3 rounded-[22px] bg-ash-grey-50 px-3 py-3">
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="h-14 w-14 rounded-2xl bg-white" />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
                    <Text className="text-2xl">{item.emoji ?? '🍽️'}</Text>
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-semibold text-[15px] text-neutral-900" numberOfLines={2}>
                    {item.label}
                  </Text>
                  <Text className="mt-0.5 text-sm text-neutral-500">{servingText(item)}</Text>
                </View>
                <Text className="font-sans-bold text-sm text-blue-spruce-800">
                  {item.nutrition.caloriesKcal} kcal
                </Text>
              </View>
            ))}
          </View>
          <Text className="mt-3 px-1 text-center text-[11px] text-ash-grey-400">{t.log.reviewLockedHint}</Text>
        </View>
      ) : null}

      <View className={`flex-row items-start gap-2.5 rounded-2xl px-3.5 py-3 ${flag.bg}`}>
        <Ionicons name={flag.icon} size={16} color={palette['blue-spruce'][800]} style={{ marginTop: 1 }} />
        <Text className={`min-w-0 flex-1 text-[13px] leading-5 ${flag.text}`}>{analysis.healthMessage}</Text>
      </View>

      <MealTypeCard selected={selectedMealType} onSelect={onSelectMealType} />
    </>
  );
}
