import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CoachAuthoredInsight } from '@/services/remote/consumerApi';
import type { MealSubmission } from '@/types';

export type InsightKind = 'insight' | 'tip' | 'coach';

export type InsightCard = {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
};

const KIND_META: Record<
  InsightKind,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string; iconColor: string }
> = {
  insight: {
    label: 'Insight',
    icon: 'sparkles-outline',
    tint: 'bg-cinnamon-wood-50',
    iconColor: '#C45A11',
  },
  tip: {
    label: 'Tip',
    icon: 'bulb-outline',
    tint: 'bg-shamrock-50',
    iconColor: '#1D9E75',
  },
  coach: {
    label: 'From coach',
    icon: 'chatbubble-ellipses-outline',
    tint: 'bg-blue-spruce-50',
    iconColor: '#023459',
  },
};

const FILTERS: Array<{ id: 'all' | InsightKind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'insight', label: 'Insights' },
  { id: 'tip', label: 'Tips' },
  { id: 'coach', label: 'Coach' },
];

function mapCoachInsight(item: CoachAuthoredInsight): InsightCard {
  const kind: InsightKind =
    item.type === 'tip' || item.type === 'reminder' ? 'tip' : item.type === 'coach_note' ? 'coach' : 'insight';
  return {
    id: `coach-insight-${item.id}`,
    kind,
    title: item.title?.trim() || KIND_META[kind].label,
    body: item.body?.trim() || '',
  };
}

function buildMealInsightCards(
  meal: MealSubmission,
  coachInsights: CoachAuthoredInsight[] = [],
): InsightCard[] {
  const cards: InsightCard[] = [];

  // Coach note stays in its own hero card on the meal screen — carousel is complementary.
  const health = meal.healthMessage?.trim();
  if (health && health !== 'Your coach will confirm nutrition from this submission.') {
    cards.push({
      id: 'health-message',
      kind: 'insight',
      title: 'Meal insight',
      body: health,
    });
  }

  const totals = meal.totalNutrition;
  if (totals) {
    if ((totals.fiberG ?? 0) >= 8) {
      cards.push({
        id: 'tip-fiber',
        kind: 'tip',
        title: 'Solid fiber',
        body: `This meal brings about ${Math.round(totals.fiberG)}g of fiber — helpful for digestion and steady energy.`,
      });
    }
    if ((totals.proteinG ?? 0) >= 25) {
      cards.push({
        id: 'tip-protein',
        kind: 'tip',
        title: 'Protein boost',
        body: `About ${Math.round(totals.proteinG)}g of protein here — a strong building block toward your daily target.`,
      });
    }
    if ((totals.sodiumMg ?? 0) >= 600) {
      cards.push({
        id: 'tip-sodium',
        kind: 'tip',
        title: 'Watch sodium',
        body: `Sodium is around ${Math.round(totals.sodiumMg!)}mg in this meal. Pair with water and lower-salt options later if needed.`,
      });
    }
  }

  for (const item of coachInsights.slice(0, 4)) {
    const mapped = mapCoachInsight(item);
    if (mapped.body) cards.push(mapped);
  }

  if (cards.length === 0 && meal.status === 'approved') {
    cards.push({
      id: 'tip-default',
      kind: 'tip',
      title: 'Keep logging',
      body: 'Consistent meal logs help your coach spot patterns and give sharper guidance over time.',
    });
  }

  return cards;
}

type MealInsightsCarouselProps = {
  meal: MealSubmission;
  coachInsights?: CoachAuthoredInsight[];
  onAskCoach?: () => void;
};

export function MealInsightsCarousel({
  meal,
  coachInsights = [],
  onAskCoach,
}: MealInsightsCarouselProps) {
  const cards = useMemo(
    () => buildMealInsightCards(meal, coachInsights),
    [meal, coachInsights],
  );
  const [filter, setFilter] = useState<'all' | InsightKind>('all');

  const visible = useMemo(
    () => (filter === 'all' ? cards : cards.filter((card) => card.kind === filter)),
    [cards, filter],
  );

  const availableFilters = useMemo(() => {
    const present = new Set(cards.map((card) => card.kind));
    return FILTERS.filter((f) => f.id === 'all' || present.has(f.id));
  }, [cards]);

  if (!cards.length) return null;

  return (
    <View className="rounded-2xl bg-white px-4 py-4">
      <View className="mb-1 flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-sans-semibold text-base text-neutral-900">Tips & insights</Text>
          <Text className="mt-0.5 text-sm text-neutral-500">
            Browse by type — swipe for more
          </Text>
        </View>
        <Text className="text-xs font-sans-semibold text-neutral-400">
          {visible.length}/{cards.length}
        </Text>
      </View>

      {/* Layer 2: structured category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="mt-3 gap-2 pr-1">
        {availableFilters.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1.5 ${
                active
                  ? 'border-blue-spruce-700 bg-blue-spruce-700'
                  : 'border-ash-grey-200 bg-ash-grey-50'
              }`}>
              <Text
                className={`text-[11px] font-sans-semibold ${
                  active ? 'text-white' : 'text-neutral-600'
                }`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={268}
        className="mt-3"
        contentContainerClassName="gap-3 pr-1">
        {visible.map((card) => {
          const meta = KIND_META[card.kind];
          return (
            <Pressable
              key={card.id}
              onPress={card.kind === 'coach' ? onAskCoach : undefined}
              className={`w-[256px] rounded-2xl border border-ash-grey-100 p-4 ${meta.tint}`}>
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-white/80">
                  <Ionicons name={meta.icon} size={16} color={meta.iconColor} />
                </View>
                <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-neutral-500">
                  {meta.label}
                </Text>
              </View>
              <Text className="font-sans-semibold text-sm text-neutral-900">{card.title}</Text>
              <Text className="mt-1.5 text-sm leading-5 text-neutral-600" numberOfLines={5}>
                {card.body}
              </Text>
              {card.kind === 'coach' && onAskCoach ? (
                <Text className="mt-3 text-xs font-sans-semibold text-blue-spruce-700">
                  Message coach →
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
