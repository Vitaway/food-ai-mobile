import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type ReportHealthTrendBarsProps = {
  trend: Array<{ date: string; totalScore: number }>;
};

export function ReportHealthTrendBars({ trend }: ReportHealthTrendBarsProps) {
  const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-10);
  if (!recent.length) return null;

  const max = Math.max(...recent.map((row) => row.totalScore), 100);

  return (
    <View className="mt-3">
      <Text className="text-xs font-sans-semibold uppercase text-neutral-500">Health score trend</Text>
      <View className="mt-2 h-24 flex-row items-end justify-between gap-1">
        {recent.map((row) => {
          const heightPct = row.totalScore > 0 ? Math.max((row.totalScore / max) * 100, 10) : 6;
          return (
            <View key={row.date} className="flex-1 items-center">
              <Text className="mb-1 text-[9px] text-neutral-500">{row.totalScore || ''}</Text>
              <View
                className="w-full rounded-t-md bg-shamrock-500"
                style={{ height: `${heightPct}%`, minHeight: 4, opacity: row.totalScore > 0 ? 1 : 0.25 }}
              />
              <Text className="mt-1 text-[8px] text-neutral-400">{row.date.slice(8)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
