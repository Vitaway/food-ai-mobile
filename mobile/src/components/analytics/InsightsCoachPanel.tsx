import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { AnalyticsSnapshot } from '@/services/local/analytics';
import type { Recommendation } from '@/services/local/recommendations';
import type { MealSwapSuggestion } from '@/data/mealSwapSuggestions';

const TONE_ICON: Record<Recommendation['tone'], keyof typeof Ionicons.glyphMap> = {
  neutral: 'information-circle-outline',
  positive: 'checkmark-circle-outline',
  warning: 'alert-circle-outline',
  tip: 'bulb-outline',
};

const TONE_BG: Record<Recommendation['tone'], string> = {
  neutral: 'bg-ash-grey-50 border-ash-grey-100',
  positive: 'bg-shamrock-50 border-shamrock-100',
  warning: 'bg-cinnamon-wood-50 border-cinnamon-wood-100',
  tip: 'bg-blue-spruce-50 border-blue-spruce-100',
};

type InsightsCoachPanelProps = {
  snapshot: AnalyticsSnapshot;
  tips: Recommendation[];
  swaps: MealSwapSuggestion[];
  showSwaps: boolean;
  onLogMeal?: () => void;
};

export function InsightsPatternChips({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const chips = [
    { label: snapshot.calorieDistribution, tint: 'bg-blue-spruce-50', text: 'text-blue-spruce-800' },
    { label: snapshot.macroTrend, tint: 'bg-shamrock-50', text: 'text-shamrock-800' },
    { label: snapshot.habitDetection, tint: 'bg-cinnamon-wood-50', text: 'text-cinnamon-wood-700' },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <View key={chip.label} className={`rounded-full px-3 py-2 ${chip.tint}`}>
          <Text className={`text-xs font-sans-semibold ${chip.text}`}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function InsightsCoachPanel({ snapshot, tips, swaps, showSwaps, onLogMeal }: InsightsCoachPanelProps) {
  return (
    <View
      className="gap-4 rounded-3xl bg-white p-5"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      }}>
      <View>
        <Text className="font-sans-semibold text-base text-neutral-900">Patterns</Text>
        <View className="mt-3">
          <InsightsPatternChips snapshot={snapshot} />
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-sans-semibold text-base text-neutral-900">Logging insights</Text>
        <Text className="mt-1 text-sm text-neutral-500">Based on your approved meals this period</Text>
        {tips.map((tip) => (
          <View key={tip.id} className={`flex-row gap-3 rounded-2xl border p-4 ${TONE_BG[tip.tone]}`}>
            <Ionicons name={TONE_ICON[tip.tone]} size={22} color={semanticColors.primary} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-semibold text-sm text-neutral-900">{tip.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-neutral-600">{tip.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {!showSwaps && onLogMeal ? (
        <Pressable
          onPress={onLogMeal}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-blue-spruce-600 px-4 py-3.5 active:opacity-90">
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text className="font-sans-semibold text-white">Log your first meal</Text>
        </Pressable>
      ) : null}

      {showSwaps && swaps.length > 0 ? (
        <View className="gap-3">
          <Text className="font-sans-semibold text-base text-neutral-900">General meal ideas</Text>
          <Text className="text-sm text-neutral-500">
            Suggested by goal and preferences — not a personal meal plan
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-1">
            {swaps.map((swap) => (
              <View
                key={swap.id}
                className="w-56 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4"
                style={{
                  shadowColor: '#1a1c17',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 1,
                }}>
                <Text className="font-sans-semibold text-neutral-900">{swap.title}</Text>
                <Text className="mt-1 text-sm leading-5 text-neutral-600" numberOfLines={3}>
                  {swap.description}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <View className="rounded-full bg-white px-2.5 py-1">
                    <Text className="text-xs font-sans-medium text-cinnamon-wood-600">~{swap.caloriesKcal} kcal</Text>
                  </View>
                  <View className="rounded-full bg-white px-2.5 py-1">
                    <Text className="text-xs font-sans-medium text-shamrock-700">{swap.proteinG}g protein</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
