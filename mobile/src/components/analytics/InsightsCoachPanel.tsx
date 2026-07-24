import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { CoachAuthoredInsight } from '@/services/remote/consumerApi';
import type { MealSwapSuggestion } from '@/data/mealSwapSuggestions';

const TYPE_ICON: Record<CoachAuthoredInsight['type'], keyof typeof Ionicons.glyphMap> = {
  tip: 'bulb-outline',
  celebration: 'trophy-outline',
  reminder: 'notifications-outline',
  coach_note: 'chatbubble-ellipses-outline',
  trend: 'trending-up-outline',
};

const TYPE_BG: Record<CoachAuthoredInsight['type'], string> = {
  tip: 'bg-blue-spruce-50 border-blue-spruce-100',
  celebration: 'bg-shamrock-50 border-shamrock-100',
  reminder: 'bg-cinnamon-wood-50 border-cinnamon-wood-100',
  coach_note: 'bg-blue-spruce-50 border-blue-spruce-100',
  trend: 'bg-shamrock-50 border-shamrock-100',
};

function formatInsightDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

type InsightsCoachPanelProps = {
  insights: CoachAuthoredInsight[];
  loading?: boolean;
  swaps: MealSwapSuggestion[];
  showSwaps: boolean;
  onLogMeal?: () => void;
  onOpenChat?: () => void;
};

export function InsightsCoachPanel({
  insights,
  loading = false,
  swaps,
  showSwaps,
  onLogMeal,
  onOpenChat,
}: InsightsCoachPanelProps) {
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
        <Text className="font-sans-semibold text-base text-neutral-900">From your coach</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Personalized notes and tips your coach sends you
        </Text>
      </View>

      {loading ? (
        <Text className="text-sm text-neutral-500">Loading coach insights…</Text>
      ) : insights.length === 0 ? (
        <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4">
          <Text className="font-sans-semibold text-sm text-neutral-900">No insights yet</Text>
          <Text className="mt-1 text-sm leading-5 text-neutral-600">
            When your coach sends a tip or note, it will show up here. Keep logging meals so they have
            context.
          </Text>
          {onLogMeal ? (
            <Pressable
              onPress={onLogMeal}
              className="mt-3 self-start rounded-xl bg-blue-spruce-600 px-3.5 py-2 active:opacity-90">
              <Text className="font-sans-semibold text-sm text-white">Log a meal</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View className="gap-3">
          {insights.map((insight) => (
            <Pressable
              key={insight.id}
              onPress={onOpenChat}
              className={`flex-row gap-3 rounded-2xl border p-4 active:opacity-90 ${TYPE_BG[insight.type]}`}>
              <Ionicons
                name={TYPE_ICON[insight.type]}
                size={22}
                color={semanticColors.primary}
              />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="min-w-0 flex-1 font-sans-semibold text-sm text-neutral-900">
                    {insight.title}
                  </Text>
                  {insight.createdAt ? (
                    <Text className="shrink-0 text-[11px] text-neutral-400">
                      {formatInsightDate(insight.createdAt)}
                    </Text>
                  ) : null}
                </View>
                <Text className="mt-1 text-sm leading-5 text-neutral-600">{insight.body}</Text>
                {onOpenChat ? (
                  <Text className="mt-1.5 text-xs font-sans-semibold text-blue-spruce-700">
                    Message coach
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}

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
                    <Text className="text-xs font-sans-medium text-cinnamon-wood-600">
                      ~{swap.caloriesKcal} kcal
                    </Text>
                  </View>
                  <View className="rounded-full bg-white px-2.5 py-1">
                    <Text className="text-xs font-sans-semibold text-shamrock-700">
                      {swap.proteinG}g protein
                    </Text>
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
