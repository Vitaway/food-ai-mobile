import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ReportHealthTrendBars } from '@/components/profile/ReportHealthTrendBars';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import {
  fetchConsumerReports,
  type ConsumerReportSnapshot,
} from '@/services/remote/consumerApi';
import {
  flattenReportMetrics,
  formatReportDate,
  periodLabel,
  reportKpis,
  shareConsumerReportPdf,
} from '@/utils/reportExport';
import { consumePendingReport } from '@/utils/reportViewerStore';

export default function ReportViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [report, setReport] = useState<ConsumerReportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const pending = consumePendingReport();
    if (pending) {
      setReport(pending);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchConsumerReports()
      .then((list) => {
        if (!active) return;
        const found = typeof id === 'string' ? list.find((row) => row.id === id) : null;
        if (!found) {
          setError('Report not found.');
          return;
        }
        setReport(found);
      })
      .catch(() => {
        if (active) setError('Could not load this report.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const kpis = useMemo(() => (report ? reportKpis(report) : []), [report]);
  const detailRows = useMemo(() => (report ? flattenReportMetrics(report.metrics) : []), [report]);
  const trend = report?.metrics.healthScoreTrend as
    | Array<{ date: string; totalScore: number }>
    | undefined;

  const sections = useMemo(() => {
    const map = new Map<string, Array<{ metric: string; value: string }>>();
    for (const row of detailRows) {
      const list = map.get(row.section) ?? [];
      list.push({ metric: row.metric, value: row.value });
      map.set(row.section, list);
    }
    return [...map.entries()];
  }, [detailRows]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/profile/reports');
  };

  const handleShare = async () => {
    if (!report || sharing) return;
    setSharing(true);
    setError(null);
    try {
      await shareConsumerReportPdf(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share report.');
    } finally {
      setSharing(false);
    }
  };

  const navy = palette['blue-spruce'];

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title="Report" onBack={handleBack} />
      <StackScreenBody className="bg-ash-grey-50">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={navy[700]} />
          </View>
        ) : !report ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center font-sans-semibold text-neutral-800">
              {error ?? 'Report not found.'}
            </Text>
            <Button label="Back to reports" className="mt-5" onPress={handleBack} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="gap-4 px-5 pt-5"
              contentContainerStyle={{ paddingBottom: 120 + Math.max(insets.bottom, 12) }}>
              <View className="overflow-hidden rounded-[28px]">
                <LinearGradient
                  colors={[navy[800], navy[900]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingHorizontal: 20, paddingVertical: 22 }}>
                  <Text className="text-[11px] font-sans-bold uppercase tracking-wide text-white/70">
                    MiraFood · {periodLabel(report.period)}
                  </Text>
                  <Text className="mt-2 font-sans-bold text-[24px] leading-8 text-white">
                    Nutrition report
                  </Text>
                  <Text className="mt-2 text-sm text-white/80">
                    {formatReportDate(report.periodStart)} – {formatReportDate(report.periodEnd)}
                  </Text>
                  <Text className="mt-1 text-xs text-white/55">
                    Generated {new Date(report.createdAt).toLocaleString()}
                  </Text>
                </LinearGradient>
              </View>

              <View className="flex-row flex-wrap gap-2.5">
                {kpis.map((kpi) => (
                  <View
                    key={kpi.label}
                    className="min-w-[46%] flex-1 rounded-2xl bg-white px-4 py-3.5"
                    style={{
                      borderTopWidth: 3,
                      borderTopColor: palette.shamrock[500],
                    }}>
                    <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-ash-grey-500">
                      {kpi.label}
                    </Text>
                    <Text className="mt-1 font-sans-bold text-[22px] text-blue-spruce-900">
                      {kpi.value}
                    </Text>
                  </View>
                ))}
              </View>

              {trend?.length ? (
                <View className="rounded-2xl bg-white px-4 py-4">
                  <ReportHealthTrendBars trend={trend} />
                </View>
              ) : null}

              {sections.map(([section, rows]) => (
                <View key={section} className="overflow-hidden rounded-2xl bg-white">
                  <View className="border-b border-ash-grey-100 px-4 py-3" style={{ backgroundColor: navy[50] }}>
                    <Text className="font-sans-bold text-sm text-blue-spruce-900">{section}</Text>
                  </View>
                  {rows.map((row, index) => (
                    <View
                      key={`${section}-${row.metric}-${index}`}
                      className={`flex-row items-start justify-between gap-3 px-4 py-3 ${
                        index < rows.length - 1 ? 'border-b border-ash-grey-50' : ''
                      }`}>
                      <Text className="min-w-0 flex-1 text-sm text-ash-grey-700">{row.metric}</Text>
                      <Text className="max-w-[45%] text-right text-sm font-sans-semibold text-neutral-900">
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
            </ScrollView>

            <View
              className="absolute bottom-0 left-0 right-0 border-t border-ash-grey-100 bg-white px-5 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button label="Done" variant="outline" fullWidth onPress={handleBack} />
                </View>
                <View className="flex-1">
                  <Button
                    label={sharing ? 'Preparing…' : 'Share PDF'}
                    variant="primary"
                    fullWidth
                    loading={sharing}
                    onPress={() => void handleShare()}
                  />
                </View>
              </View>
            </View>
          </>
        )}
      </StackScreenBody>
    </View>
  );
}
