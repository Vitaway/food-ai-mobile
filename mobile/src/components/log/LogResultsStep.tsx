import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Image, View } from 'react-native';

import { CompactMealTypePicker } from '@/components/log/CompactMealTypePicker';
import {
  BalancedPlateCard,
  EstimateHonestyBanner,
} from '@/components/meal/BalancedPlateCard';
import { MealFoodPins } from '@/components/meal/MealFoodPins';
import { MealPortionRow } from '@/components/meal/MealPortionRow';
import { Text } from '@/components/ui/Text';
import { isApiConfigured } from '@/constants/api';
import { semanticColors, palette } from '@/design-system/colors';
import type { MealTypeId } from '@/constants/mealTypes';
import { tf, useI18n } from '@/context/LocaleContext';
import { previewMealPortions } from '@/services/remote/consumerApi';
import type { MealAnalysisPreview } from '@/types';
import {
  estimateRangeFromMid,
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
  type MealLogSource,
} from '@/types/balancedPlate';
import {
  applyPortionGramsToAnalysis,
  mergePortionPreview,
  portionPreviewPayload,
} from '@/utils/livePortions';
import { formatMacroG } from '@/utils/formatMacro';

type LogResultsStepProps = {
  analysis: MealAnalysisPreview;
  onAnalysisChange?: (next: MealAnalysisPreview) => void;
  imageUri?: string;
  selectedMealType: MealTypeId | null;
  onSelectMealType: (id: MealTypeId) => void;
  awaitingCoachConfirm?: boolean;
  exactPortions?: boolean;
  todayKcal?: number;
  calorieTarget?: number;
};

const FLAG_STYLES = {
  green: { bg: 'bg-shamrock-50', text: 'text-shamrock-800', icon: 'leaf-outline' as const },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'alert-circle-outline' as const },
  orange: { bg: 'bg-cinnamon-wood-50', text: 'text-cinnamon-wood-700', icon: 'warning-outline' as const },
  red: { bg: 'bg-red-50', text: 'text-red-800', icon: 'alert-outline' as const },
} as const;

const PREVIEW_DEBOUNCE_MS = 320;

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
          colors={['transparent', 'rgba(26, 58, 42, 0.82)']}
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

function DayKcalDeltaCard({
  mealKcal,
  todayKcal,
  calorieTarget,
}: {
  mealKcal: number;
  todayKcal: number;
  calorieTarget: number;
}) {
  const { t } = useI18n();
  const after = Math.round(todayKcal + mealKcal);
  const target = Math.max(1, calorieTarget);
  const pct = Math.min(100, Math.round((after / target) * 100));

  return (
    <View className="rounded-[24px] border border-ash-grey-100 bg-white px-4 py-4">
      <Text className="text-[12px] font-sans-semibold uppercase tracking-wide text-ash-grey-400">
        {t.home.leftToday}
      </Text>
      <Text className="mt-1 font-sans-bold text-[18px] text-blue-spruce-900">
        {tf(t.log.dayDeltaAdds, { n: Math.round(mealKcal) })}
      </Text>
      <Text className="mt-1 text-[13px] text-ash-grey-500">
        {tf(t.log.dayDeltaOfTarget, { n: after, target })}
      </Text>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-ash-grey-100">
        <View
          className="h-full rounded-full bg-blue-spruce-700"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
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
  onAnalysisChange,
  imageUri,
  selectedMealType,
  onSelectMealType,
  awaitingCoachConfirm = false,
  exactPortions = false,
  todayKcal = 0,
  calorieTarget = 2000,
}: LogResultsStepProps) {
  const { t } = useI18n();
  const flag = FLAG_STYLES[analysis.healthFlag];
  const hasItems = analysis.items.length > 0;
  const hasCalories = analysis.totalNutrition.caloriesKcal > 0;
  const showNutrition = hasItems && hasCalories;
  const stubOnly = awaitingCoachConfirm && !showNutrition;
  const navy = palette['blue-spruce'];
  const portionsEditable = Boolean(onAnalysisChange) && hasItems && !stubOnly;
  const showPins = Boolean(imageUri && hasItems);
  const previewSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const honesty = useMemo(() => {
    const source = (analysis.logSource ?? (exactPortions ? 'barcode' : 'photo')) as MealLogSource;
    const items = withInferredPlateGroups(analysis.items);
    const balancedPlate =
      analysis.balancedPlate ??
      resolveBalancedPlateForMeal({ mealType: selectedMealType, items });
    const estimateRange =
      analysis.estimateRange ??
      estimateRangeFromMid(analysis.totalNutrition.caloriesKcal, source);
    return { balancedPlate, estimateRange };
  }, [analysis, exactPortions, selectedMealType]);

  const macros = [
    { label: 'Protein', value: formatMacroG(analysis.totalNutrition.proteinG), color: '#1D9E75' },
    { label: 'Carbs', value: formatMacroG(analysis.totalNutrition.carbsG), color: navy[700] },
    { label: 'Fat', value: formatMacroG(analysis.totalNutrition.fatG), color: semanticColors.accentOrange },
  ];

  const handleGramsChange = (itemId: string, grams: number) => {
    if (!onAnalysisChange) return;
    const optimistic = applyPortionGramsToAnalysis(analysis, itemId, grams, selectedMealType);
    onAnalysisChange(optimistic);

    if (!isApiConfigured()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const seq = ++previewSeq.current;
    debounceRef.current = setTimeout(() => {
      void previewMealPortions(portionPreviewPayload(optimistic, selectedMealType))
        .then((preview) => {
          if (seq !== previewSeq.current) return;
          onAnalysisChange(mergePortionPreview(optimistic, preview));
        })
        .catch(() => {
          /* keep optimistic local scale */
        });
    }, PREVIEW_DEBOUNCE_MS);
  };

  if (stubOnly) {
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
      {showPins && imageUri ? (
        <MealFoodPins imageUri={imageUri} items={analysis.items} />
      ) : (
        <MealHeroPreview
          imageUri={imageUri}
          mealName={analysis.mealName}
          subtitle={showNutrition ? `${analysis.totalNutrition.caloriesKcal} kcal` : t.log.readyToSubmit}
        />
      )}

      {showPins ? (
        <View className="-mt-1 px-1">
          <Text className="font-sans-bold text-[20px] text-blue-spruce-900" numberOfLines={2}>
            {analysis.mealName}
          </Text>
          {showNutrition ? (
            <Text className="mt-1 text-[14px] text-ash-grey-500">
              {analysis.totalNutrition.caloriesKcal} kcal · {analysis.items.length} items
            </Text>
          ) : null}
        </View>
      ) : null}

      {showNutrition ? (
        <DayKcalDeltaCard
          mealKcal={analysis.totalNutrition.caloriesKcal}
          todayKcal={todayKcal}
          calorieTarget={calorieTarget}
        />
      ) : null}

      {showNutrition && honesty.estimateRange && honesty.estimateRange.pct > 0 ? (
        <EstimateHonestyBanner
          midKcal={honesty.estimateRange.midKcal}
          lowKcal={honesty.estimateRange.lowKcal}
          highKcal={honesty.estimateRange.highKcal}
          pct={honesty.estimateRange.pct}
        />
      ) : null}

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

      <BalancedPlateCard score={honesty.balancedPlate} mealType={selectedMealType} />

      {hasItems ? (
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
              <MealPortionRow
                key={item.id}
                item={item}
                editable={portionsEditable}
                exact={exactPortions || analysis.logSource === 'barcode'}
                onChangeGrams={(grams) => handleGramsChange(item.id, grams)}
              />
            ))}
          </View>
          <Text className="mt-3 px-1 text-center text-[11px] text-ash-grey-400">
            {portionsEditable ? t.log.portionLiveHint : t.log.reviewLockedHint}
          </Text>
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
