import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { StackScreenBody, ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { ReportHealthTrendBars } from '@/components/profile/ReportHealthTrendBars';
import { useProfileBack } from '@/hooks/useProfileBack';
import { fetchConsumerReports, type ConsumerReportSnapshot } from '@/services/remote/consumerApi';

function metricLine(metrics: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = metrics;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current != null ? String(current) : null;
}

export default function ReportsScreen() {
  const handleBack = useProfileBack();
  const [data, setData] = useState<ConsumerReportSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchConsumerReports()
      .then((next) => {
        if (active) setData(next);
      })
      .catch(() => {
        if (active) setError('Unable to load reports right now.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Reports" onBack={handleBack} />
      <StackScreenBody>
        <ScrollView contentContainerClassName="px-5 py-6 gap-3">
          {isLoading ? <ActivityIndicator /> : null}
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          {data.length
            ? data.map((report) => {
                const calories = metricLine(report.metrics, ['nutritionSummary', 'caloriesConsumed']);
                const adherence = metricLine(report.metrics, ['adherence', 'mealsLogged']);
                const score = metricLine(report.metrics, ['currentHealthScore']);
                const trend = report.metrics.healthScoreTrend as
                  | Array<{ date: string; totalScore: number }>
                  | undefined;
                return (
                  <View key={report.id} className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4">
                    <Text className="text-sm font-semibold uppercase text-blue-spruce-700">{report.period}</Text>
                    <Text className="mt-1 text-sm text-ash-grey-700">
                      {new Date(report.periodStart).toLocaleDateString()} -{' '}
                      {new Date(report.periodEnd).toLocaleDateString()}
                    </Text>
                    {calories ? <Text className="mt-2 text-sm text-ash-grey-600">Calories: {calories}</Text> : null}
                    {adherence ? <Text className="text-sm text-ash-grey-600">Meals logged: {adherence}</Text> : null}
                    {score ? <Text className="text-sm text-ash-grey-600">Health score: {score}</Text> : null}
                    {trend?.length ? <ReportHealthTrendBars trend={trend} /> : null}
                  </View>
                );
              })
            : !isLoading && !error
              ? <Text className="text-sm text-ash-grey-500">No reports generated yet.</Text>
              : null}
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
