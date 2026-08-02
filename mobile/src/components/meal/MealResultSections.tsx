import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type {
  DetectedFoodItem,
  HealthFlagLevel,
  MacroTargets,
  MealPetal,
  MealSubmission,
  NutritionFacts,
} from '@/types';
import { formatMacroG } from '@/utils/formatMacro';
import { mealMicronutrientRows } from '@/utils/mealMicronutrients';

const RING = 88;
const RING_R = 36;
const RING_C = 2 * Math.PI * RING_R;

const FLAG_UI: Record<
  HealthFlagLevel,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap; accent: string }
> = {
  green: {
    label: 'Looks solid',
    bg: 'bg-shamrock-50',
    text: 'text-shamrock-800',
    icon: 'leaf',
    accent: '#1d9e75',
  },
  yellow: {
    label: 'Worth noting',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    icon: 'alert-circle',
    accent: '#d97706',
  },
  orange: {
    label: 'Mindful choice',
    bg: 'bg-cinnamon-wood-50',
    text: 'text-cinnamon-wood-800',
    icon: 'flame',
    accent: '#e2622d',
  },
  red: {
    label: 'Needs attention',
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: 'warning',
    accent: '#dc2626',
  },
};

function SectionEyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
      {children}
    </Text>
  );
}

export function MealAwaitingCard({ meal }: { meal: MealSubmission }) {
  const description = meal.note?.trim() || meal.textInput?.trim();
  return (
    <View className="overflow-hidden rounded-[28px] border border-cinnamon-wood-200 bg-white">
      <View className="bg-cinnamon-wood-500 px-5 py-4">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Ionicons name="time" size={18} color="#ffffff" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-white">Waiting for your coach</Text>
            <Text className="text-xs text-white/80">Nutrition unlocks after portion review</Text>
          </View>
        </View>
      </View>
      <View className="gap-3 px-5 py-4">
        <Text className="text-sm leading-5 text-ash-grey-600">
          Your coach is confirming foods and portions from your photo. You can message them anytime —
          vitamins, minerals, and macros appear here once they finish.
        </Text>
        {description ? (
          <View className="rounded-2xl bg-ash-grey-50 px-4 py-3">
            <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-ash-grey-400">
              Your description
            </Text>
            <Text className="mt-1.5 text-sm leading-5 text-ash-grey-800">{description}</Text>
          </View>
        ) : null}
        {meal.plateDiameterCm ? (
          <Text className="text-xs text-ash-grey-500">
            Plate reference · {meal.plateDiameterCm.toFixed(1)} cm
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function MealCoachSpotlight({
  note,
  reviewedAt,
}: {
  note: string;
  reviewedAt?: string | null;
}) {
  const when = reviewedAt
    ? new Date(reviewedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <View className="overflow-hidden rounded-[28px] bg-blue-spruce-800">
      <View className="px-5 pb-5 pt-5">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-cinnamon-wood-500">
            <Ionicons name="fitness" size={22} color="#ffffff" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-sans-semibold text-base text-white">Coach feedback</Text>
            <Text className="text-xs text-blue-spruce-200">
              {when ? `Reviewed ${when}` : 'Personal note from your nutritionist'}
            </Text>
          </View>
          <View className="rounded-full bg-white/10 px-2.5 py-1">
            <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-white/80">
              Verified
            </Text>
          </View>
        </View>
        <Text className="font-display text-[22px] leading-7 text-white">“{note}”</Text>
      </View>
    </View>
  );
}

export function MealNutritionHero({
  totals,
  targets,
}: {
  totals: NutritionFacts;
  targets: MacroTargets;
}) {
  const kcal = Math.round(totals.caloriesKcal);
  const calorieTarget = Math.max(1, targets.calories);
  const progress = Math.min(1, kcal / calorieTarget);
  const dash = progress * RING_C;

  const macros = [
    {
      label: 'Protein',
      value: totals.proteinG,
      target: targets.proteinG,
      color: '#1d9e75',
      unit: 'g',
    },
    {
      label: 'Carbs',
      value: totals.carbsG,
      target: targets.carbsG,
      color: '#023459',
      unit: 'g',
    },
    {
      label: 'Fat',
      value: totals.fatG,
      target: targets.fatG,
      color: semanticColors.accentOrange,
      unit: 'g',
    },
    {
      label: 'Fiber',
      value: totals.fiberG,
      target: targets.fiberG,
      color: '#6798bf',
      unit: 'g',
    },
  ];

  return (
    <View className="rounded-[28px] border border-shamrock-100 bg-white px-5 py-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <SectionEyebrow>Verified nutrition</SectionEyebrow>
          <Text className="font-display text-2xl text-blue-spruce-900">This meal</Text>
        </View>
        <View className="flex-row items-center gap-1.5 rounded-full bg-shamrock-100 px-2.5 py-1">
          <Ionicons name="checkmark-circle" size={14} color="#177e5e" />
          <Text className="text-[11px] font-sans-semibold text-shamrock-800">Confirmed</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-5">
        <View style={{ width: RING, height: RING }} className="items-center justify-center">
          <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RING_R}
              stroke="#edf8f3"
              strokeWidth={8}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RING_R}
              stroke="#1d9e75"
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${dash} ${RING_C}`}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="font-sans-bold text-[22px] leading-6 text-blue-spruce-900">{kcal}</Text>
            <Text className="text-[10px] uppercase tracking-wide text-ash-grey-400">kcal</Text>
          </View>
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-sm text-ash-grey-600">
            {Math.round(progress * 100)}% of your {calorieTarget.toLocaleString()} kcal daily target
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { label: 'Sugar', value: `${formatMacroG(totals.sugarG ?? 0)}` },
              { label: 'Sodium', value: `${Math.round(totals.sodiumMg ?? 0)} mg` },
            ].map((chip) => (
              <View key={chip.label} className="rounded-full bg-ash-grey-50 px-3 py-1.5">
                <Text className="text-[11px] text-ash-grey-600">
                  {chip.label}{' '}
                  <Text className="font-sans-semibold text-ash-grey-900">{chip.value}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="mt-5 gap-3">
        {macros.map((macro) => {
          const pct =
            macro.target > 0 ? Math.min(100, Math.round((macro.value / macro.target) * 100)) : 0;
          return (
            <View key={macro.label}>
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-sm font-sans-semibold text-ash-grey-800">{macro.label}</Text>
                <Text className="text-xs text-ash-grey-500">
                  {formatMacroG(macro.value)}
                  {macro.target > 0 ? ` · ${pct}% of day` : ''}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(4, pct)}%`, backgroundColor: macro.color }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Stub copy from pre-submit / awaiting flow — never show after a meal is already logged. */
function isStaleAwaitingInsight(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('coach will confirm') ||
    lower.includes('coach is reviewing') ||
    lower.includes('waiting for coach') ||
    lower.includes('from this submission')
  );
}

export function MealHealthInsight({
  flag,
  message,
}: {
  flag?: HealthFlagLevel | null;
  message?: string | null;
}) {
  const copy = message?.trim() ?? '';
  if (!copy || isStaleAwaitingInsight(copy)) return null;
  // Flag alone without a real tip is not worth a banner.
  if (!flag && !copy) return null;

  const ui = FLAG_UI[flag ?? 'green'];

  return (
    <View className={`rounded-[28px] px-5 py-4 ${ui.bg}`}>
      <View className="flex-row items-start gap-3">
        <View
          className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-white"
          style={{ borderWidth: 1, borderColor: `${ui.accent}33` }}>
          <Ionicons name={ui.icon} size={18} color={ui.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className={`text-xs font-sans-semibold uppercase tracking-wide ${ui.text}`}>
            {ui.label}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-ash-grey-800">{copy}</Text>
        </View>
      </View>
    </View>
  );
}

export function MealPlateComposition({
  items,
  petals,
}: {
  items: DetectedFoodItem[];
  petals?: MealPetal[] | null;
}) {
  if (!items.length) return null;

  return (
    <View className="rounded-[28px] bg-white px-5 py-5">
      <SectionEyebrow>On your plate</SectionEyebrow>
      <Text className="mb-4 font-display text-2xl text-blue-spruce-900">
        {items.length} confirmed {items.length === 1 ? 'item' : 'items'}
      </Text>

      {petals && petals.length > 0 ? (
        <View className="mb-4 gap-2">
          {petals.slice(0, 6).map((petal) => (
            <View key={petal.label}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-xs text-ash-grey-600">{petal.label}</Text>
                <Text className="text-xs font-sans-semibold text-ash-grey-800">
                  {Math.round(petal.percent)}%
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-ash-grey-100">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, Math.min(100, petal.percent))}%`,
                    backgroundColor: petal.color || '#023459',
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View className="gap-2">
        {items.map((item) => {
          const serving =
            item.servingAmount && item.servingUnit
              ? `${item.servingAmount} ${item.servingUnit}`
              : item.estimatedWeightG > 0
                ? `${Math.round(item.estimatedWeightG)} g`
                : 'Portion confirmed';
          return (
            <View
              key={item.id}
              className="flex-row items-center gap-3 rounded-2xl bg-ash-grey-50 px-3 py-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                <Text className="text-lg">{item.emoji ?? '🍽️'}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-semibold text-sm text-ash-grey-900" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text className="mt-0.5 text-xs text-ash-grey-500">{serving}</Text>
              </View>
              <View className="items-end">
                <Text className="font-sans-semibold tabular-nums text-sm text-blue-spruce-800">
                  {Math.round(item.nutrition.caloriesKcal)}
                </Text>
                <Text className="text-[10px] uppercase tracking-wide text-ash-grey-400">kcal</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function MealNutrientDeepDive({
  totals,
  items,
}: {
  totals: NutritionFacts;
  items?: DetectedFoodItem[];
}) {
  const [open, setOpen] = useState(false);
  const microRows = useMemo(() => mealMicronutrientRows(items), [items]);

  const macroRows = [
    ['Energy', `${Math.round(totals.caloriesKcal)} kcal`],
    ['Protein', formatMacroG(totals.proteinG)],
    ['Carbohydrate', formatMacroG(totals.carbsG)],
    ['Fat', formatMacroG(totals.fatG)],
    ['Fiber', formatMacroG(totals.fiberG)],
    ['Sugar', formatMacroG(totals.sugarG ?? 0)],
    ['Sodium', `${Math.round(totals.sodiumMg ?? 0)} mg`],
  ] as const;

  return (
    <View className="overflow-hidden rounded-[28px] border border-ash-grey-100 bg-white">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-3 px-5 py-4 active:bg-ash-grey-50">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-spruce-50">
          <Ionicons name="flask" size={18} color="#023459" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-sans-semibold text-ash-grey-900">Full nutrition detail</Text>
          <Text className="text-xs text-ash-grey-500">
            Macros{microRows.length ? ` · ${microRows.length} vitamins & minerals` : ''}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#848a75" />
      </Pressable>

      {open ? (
        <View className="gap-2 border-t border-ash-grey-100 px-5 py-4">
          <SectionEyebrow>Macros</SectionEyebrow>
          {macroRows.map(([label, value]) => (
            <View key={label} className="flex-row items-center justify-between py-1">
              <Text className="text-sm text-ash-grey-500">{label}</Text>
              <Text className="text-sm font-sans-semibold tabular-nums text-ash-grey-900">{value}</Text>
            </View>
          ))}

          <View className="mt-3">
            <SectionEyebrow>Vitamins & minerals</SectionEyebrow>
            {microRows.length ? (
              microRows.map((row) => (
                <View key={row.key} className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-ash-grey-500">{row.label}</Text>
                  <Text className="text-sm font-sans-semibold tabular-nums text-ash-grey-900">
                    {row.display}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-sm leading-5 text-ash-grey-500">
                No micronutrient data for these foods yet. When items are linked from the food
                database, vitamins and minerals show up here.
              </Text>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function MealMetaFooter({ meal }: { meal: MealSubmission }) {
  const bits: string[] = [];
  if (meal.mealClassification && meal.mealClassification !== 'unknown') {
    bits.push(meal.mealClassification);
  }
  if (typeof meal.confidenceAvg === 'number' && meal.confidenceAvg > 0) {
    bits.push(`${Math.round(meal.confidenceAvg * 100)}% AI confidence`);
  }
  if (meal.plateDiameterCm) {
    bits.push(`${meal.plateDiameterCm.toFixed(1)} cm plate`);
  }
  if (!bits.length && !meal.note?.trim()) return null;

  return (
    <View className="rounded-[28px] bg-white px-5 py-4">
      {bits.length ? (
        <>
          <SectionEyebrow>Details</SectionEyebrow>
          <View className="mb-2 flex-row flex-wrap gap-2">
            {bits.map((bit) => (
              <View key={bit} className="rounded-full bg-ash-grey-50 px-3 py-1.5">
                <Text className="text-xs capitalize text-ash-grey-600">{bit}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {meal.note?.trim() ? (
        <View className={bits.length ? 'mt-2 border-t border-ash-grey-100 pt-3' : ''}>
          <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-ash-grey-400">
            Your note
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-ash-grey-700">{meal.note.trim()}</Text>
        </View>
      ) : null}
    </View>
  );
}
