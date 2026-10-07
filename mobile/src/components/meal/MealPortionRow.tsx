import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { useI18n } from '@/context/LocaleContext';
import type { DetectedFoodItem } from '@/types';
import { formatServingLabel } from '@/utils/servingUnits';

const STEP_G = 10;
const MIN_G = 1;
const MAX_G = 5000;

type MealPortionRowProps = {
  item: DetectedFoodItem;
  /** When false, grams are read-only (Grace confirmed or Exact lock). */
  editable?: boolean;
  /** Barcode / label Exact badge. */
  exact?: boolean;
  onChangeGrams?: (grams: number) => void;
};

function servingText(item: DetectedFoodItem): string {
  if (item.servingUnit && item.servingUnit !== 'g' && item.servingAmount != null && item.servingAmount > 0) {
    return formatServingLabel(item.servingAmount, item.servingUnit);
  }
  return formatServingLabel(item.estimatedWeightG, 'g');
}

export function MealPortionRow({
  item,
  editable = false,
  exact = false,
  onChangeGrams,
}: MealPortionRowProps) {
  const { t } = useI18n();
  const grams = Math.round(item.estimatedWeightG);
  const canEdit = editable && !!onChangeGrams;

  const nudge = (direction: 1 | -1) => {
    if (!onChangeGrams) return;
    onChangeGrams(Math.max(MIN_G, Math.min(MAX_G, grams + direction * STEP_G)));
  };

  return (
    <View className="rounded-[22px] bg-ash-grey-50 px-3 py-3">
      <View className="flex-row items-center gap-3">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="h-14 w-14 rounded-2xl bg-white" />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <Text className="text-2xl">{item.emoji ?? '🍽️'}</Text>
          </View>
        )}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 font-sans-semibold text-[15px] text-neutral-900" numberOfLines={2}>
              {item.label}
            </Text>
            {exact ? (
              <View className="rounded-full bg-shamrock-100 px-2 py-0.5">
                <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-shamrock-800">
                  {t.log.portionExact}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-sm text-neutral-500">{servingText(item)}</Text>
        </View>
        <Text className="font-sans-bold text-sm text-blue-spruce-800">
          {Math.round(item.nutrition.caloriesKcal)} kcal
        </Text>
      </View>

      {canEdit ? (
        <View className="mt-3 flex-row items-center justify-between border-t border-ash-grey-100 pt-3">
          <Text className="text-[12px] text-ash-grey-500">{t.log.portionAdjust}</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => nudge(-1)}
              disabled={grams <= MIN_G}
              accessibilityRole="button"
              accessibilityLabel={t.log.portionDecrease}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-white"
              style={{ opacity: grams <= MIN_G ? 0.4 : 1 }}>
              <Ionicons name="remove" size={18} color={palette['blue-spruce'][800]} />
            </Pressable>
            <View className="min-w-[72px] items-center rounded-2xl bg-white px-3 py-2">
              <Text className="font-sans-bold tabular-nums text-[15px] text-blue-spruce-900">
                {grams} g
              </Text>
            </View>
            <Pressable
              onPress={() => nudge(1)}
              disabled={grams >= MAX_G}
              accessibilityRole="button"
              accessibilityLabel={t.log.portionIncrease}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-white"
              style={{ opacity: grams >= MAX_G ? 0.4 : 1 }}>
              <Ionicons name="add" size={18} color={palette['blue-spruce'][800]} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
