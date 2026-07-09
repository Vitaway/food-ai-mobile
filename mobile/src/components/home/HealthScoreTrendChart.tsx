import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { HealthScoreHistoryEntry } from '@/services/remote/consumerApi';

type HealthScoreTrendChartProps = {
  entries: HealthScoreHistoryEntry[];
};

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

function formatLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HealthScoreTrendChart({ entries }: HealthScoreTrendChartProps) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);
  const hasAny = recent.some((entry) => entry.totalScore > 0);
  const maxScore = Math.max(...recent.map((entry) => entry.totalScore), 100);

  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Health score trend</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Last {recent.length} days from your server history</Text>

      {!hasAny ? (
        <View className="mt-5 rounded-2xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-4 py-8">
          <Text className="text-center font-sans-semibold text-neutral-700">No score history yet</Text>
          <Text className="mt-1 text-center text-sm text-neutral-500">
            Log meals and check back — your daily score is saved automatically.
          </Text>
        </View>
      ) : (
        <View className="mt-5">
          <View className="relative h-36 flex-row items-end justify-between gap-1">
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 border-t border-dashed border-shamrock-300"
              style={{ bottom: `${(80 / maxScore) * 100}%` }}
            />
            {recent.map((entry) => {
              const heightPct =
                entry.totalScore > 0 ? Math.max((entry.totalScore / maxScore) * 100, 8) : 4;
              const active = entry.totalScore > 0;
              return (
                <View key={entry.date} className="flex-1 items-center">
                  <Text className="mb-1 text-[10px] font-sans-medium text-neutral-500">
                    {active ? entry.totalScore : ''}
                  </Text>
                  <View
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: active ? 10 : 4,
                      backgroundColor: active ? semanticColors.healthGreen : '#E8EAE4',
                      opacity: active ? 1 : 0.5,
                    }}
                  />
                  <Text className="mt-2 text-[10px] font-sans-medium text-neutral-400">
                    {formatLabel(entry.date)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className="mt-3 text-xs text-neutral-400">Dashed line = 80 score benchmark</Text>
        </View>
      )}
    </View>
  );
}
