import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { MealSwapSuggestion } from '@/data/mealSwapSuggestions';
import type { Recommendation, RecommendationTone } from '@/services/local/recommendations';

const TONE_STYLES: Record<
  RecommendationTone,
  { card: string; title: string; body: string }
> = {
  neutral: {
    card: 'bg-ash-grey-50 border-ash-grey-100',
    title: 'text-neutral-900',
    body: 'text-neutral-600',
  },
  positive: {
    card: 'bg-shamrock-50 border-shamrock-100',
    title: 'text-shamrock-900',
    body: 'text-shamrock-800',
  },
  warning: {
    card: 'bg-amber-50 border-amber-100',
    title: 'text-amber-900',
    body: 'text-amber-800',
  },
  tip: {
    card: 'bg-blue-spruce-50 border-blue-spruce-100',
    title: 'text-blue-spruce-900',
    body: 'text-blue-spruce-800',
  },
};

type RecommendationListProps = {
  tips: Recommendation[];
  swaps?: MealSwapSuggestion[];
  title?: string;
};

export function RecommendationList({ tips, swaps = [], title = 'Coach tips' }: RecommendationListProps) {
  if (tips.length === 0 && swaps.length === 0) return null;

  return (
    <View className="gap-3">
      <Text className="font-sans-semibold text-base text-neutral-900">{title}</Text>
      {tips.map((tip) => {
        const style = TONE_STYLES[tip.tone];
        return (
          <View key={tip.id} className={`rounded-2xl border px-4 py-3 ${style.card}`}>
            <Text className={`font-sans-semibold text-sm ${style.title}`}>{tip.title}</Text>
            <Text className={`mt-1 text-sm leading-5 ${style.body}`}>{tip.body}</Text>
          </View>
        );
      })}
      {swaps.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm font-sans-medium text-neutral-600">Try instead</Text>
          {swaps.map((swap) => (
            <View
              key={swap.id}
              className="rounded-2xl border border-ash-grey-100 bg-white px-4 py-3 shadow-sm">
              <Text className="font-sans-semibold text-sm text-neutral-900">{swap.title}</Text>
              <Text className="mt-0.5 text-sm text-neutral-600">{swap.description}</Text>
              <Text className="mt-1 text-xs text-neutral-500">
                ~{swap.caloriesKcal} kcal · {swap.proteinG}g protein
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
