import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ReportHealthTrendBars } from '@/components/profile/ReportHealthTrendBars';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { StackScreenBody, ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { useI18n } from '@/context/LocaleContext';
import { useProfileBack } from '@/hooks/useProfileBack';
import {
  fetchConsumerReports,
  generateConsumerReport,
  type ConsumerReportSnapshot,
} from '@/services/remote/consumerApi';
import { formatDateOfBirthInput } from '@/utils/dateOfBirth';
import { todayKey } from '@/utils/dates';
import { setPendingReport } from '@/utils/reportViewerStore';

type ReportPeriod = 'weekly' | 'monthly' | 'custom';

function metricLine(metrics: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = metrics;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current != null ? String(current) : null;
}

function daysAgoKey(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return todayKey(date);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return (
    parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d
  );
}

function periodChipLabel(period: string) {
  if (period === 'custom') return 'Custom';
  if (period === 'monthly') return 'Monthly';
  return 'Weekly';
}

function ReportCard({
  report,
  onView,
  viewLabel,
}: {
  report: ConsumerReportSnapshot;
  onView: () => void;
  viewLabel: string;
}) {
  const calories = metricLine(report.metrics, ['nutritionSummary', 'caloriesConsumed']);
  const adherence = metricLine(report.metrics, ['adherence', 'mealsLogged']);
  const score = metricLine(report.metrics, ['currentHealthScore']);
  const trend = report.metrics.healthScoreTrend as
    | Array<{ date: string; totalScore: number }>
    | undefined;

  return (
    <Pressable
      onPress={onView}
      className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4 active:opacity-95">
      <Text className="text-sm font-sans-semibold uppercase text-blue-spruce-700">
        {periodChipLabel(report.period)}
      </Text>
      <Text className="mt-1 text-sm text-ash-grey-700">
        {new Date(report.periodStart).toLocaleDateString()} –{' '}
        {new Date(report.periodEnd).toLocaleDateString()}
      </Text>
      {calories ? <Text className="mt-2 text-sm text-ash-grey-600">Calories: {calories}</Text> : null}
      {adherence ? (
        <Text className="text-sm text-ash-grey-600">Meals logged: {adherence}</Text>
      ) : null}
      {score ? <Text className="text-sm text-ash-grey-600">Health score: {score}</Text> : null}
      {trend?.length ? <ReportHealthTrendBars trend={trend} /> : null}
      <Button label={viewLabel} variant="primary" size="sm" className="mt-3" onPress={onView} />
    </Pressable>
  );
}

export default function ReportsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const handleBack = useProfileBack();
  const [data, setData] = useState<ConsumerReportSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [from, setFrom] = useState(daysAgoKey(6));
  const [to, setTo] = useState(todayKey());
  const [generated, setGenerated] = useState<ConsumerReportSnapshot | null>(null);
  const [generating, setGenerating] = useState(false);

  const openReport = useCallback(
    (report: ConsumerReportSnapshot) => {
      setPendingReport(report);
      router.push({
        pathname: '/profile/report-view',
        params: { id: report.id },
      });
    },
    [router],
  );

  const reload = useCallback(async () => {
    const next = await fetchConsumerReports();
    setData(next);
  }, []);

  useEffect(() => {
    let active = true;
    void reload()
      .catch(() => {
        if (active) setError('Unable to load reports right now.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);

  const customValid = useMemo(() => {
    if (!isValidIsoDate(from) || !isValidIsoDate(to)) return false;
    return from <= to && to <= todayKey();
  }, [from, to]);

  const canGenerate = period !== 'custom' || customValid;

  async function handleGenerate() {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const report = await generateConsumerReport({
        period,
        from: period === 'custom' ? from : undefined,
        to: period === 'custom' ? to : undefined,
      });
      setGenerated(report);
      await reload();
      openReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate report.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title={t.reports.title} onBack={handleBack} />
      <StackScreenBody>
        <ScrollView contentContainerClassName="gap-4 px-5 py-6" keyboardShouldPersistTaps="handled">
          <FreePlanBanner />

          <View className="rounded-2xl border border-ash-grey-100 bg-white p-4">
            <Text className="font-sans-semibold text-base text-neutral-900">{t.reports.buildTitle}</Text>
            <Text className="mt-1 text-sm text-neutral-500">{t.reports.buildHint}</Text>

            <Text className="mb-2 mt-4 text-sm font-sans-semibold text-neutral-800">
              {t.reports.period}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  ['weekly', t.reports.last7],
                  ['monthly', t.reports.last30],
                  ['custom', t.reports.customDates],
                ] as const
              ).map(([value, label]) => {
                const active = period === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setPeriod(value);
                      setGenerated(null);
                    }}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-blue-spruce-700 bg-blue-spruce-700'
                        : 'border-ash-grey-200 bg-ash-grey-50'
                    }`}>
                    <Text
                      className={`text-xs font-sans-semibold ${
                        active ? 'text-white' : 'text-neutral-600'
                      }`}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {period === 'custom' ? (
              <View className="mt-4 gap-3">
                <View>
                  <Text className="mb-1.5 text-sm font-sans-medium text-neutral-700">
                    {t.reports.from}
                  </Text>
                  <TextInput
                    value={from}
                    onChangeText={(text) => {
                      setFrom(formatDateOfBirthInput(text));
                      setGenerated(null);
                    }}
                    placeholder="YYYY-MM-DD"
                    keyboardType="number-pad"
                    maxLength={10}
                    className="rounded-xl border border-ash-grey-200 bg-white px-3 py-3 text-sm text-neutral-900"
                  />
                </View>
                <View>
                  <Text className="mb-1.5 text-sm font-sans-medium text-neutral-700">
                    {t.reports.to}
                  </Text>
                  <TextInput
                    value={to}
                    onChangeText={(text) => {
                      setTo(formatDateOfBirthInput(text));
                      setGenerated(null);
                    }}
                    placeholder="YYYY-MM-DD"
                    keyboardType="number-pad"
                    maxLength={10}
                    className="rounded-xl border border-ash-grey-200 bg-white px-3 py-3 text-sm text-neutral-900"
                  />
                </View>
                {!customValid ? (
                  <Text className="text-xs text-red-600">
                    Enter valid From/To dates (From ≤ To, To not after today).
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text className="mt-3 text-sm text-neutral-500">
                {period === 'weekly' ? t.reports.weeklyHint : t.reports.monthlyHint}
              </Text>
            )}

            <Button
              label={generating ? t.reports.generating : t.reports.generate}
              className="mt-4"
              loading={generating}
              disabled={!canGenerate}
              onPress={() => void handleGenerate()}
            />
          </View>

          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

          {generated ? (
            <View className="gap-2">
              <Text className="font-sans-semibold text-base text-neutral-900">{t.reports.latest}</Text>
              <ReportCard
                report={generated}
                viewLabel={t.reports.viewReport}
                onView={() => openReport(generated)}
              />
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="font-sans-semibold text-base text-neutral-900">{t.reports.past}</Text>
            {isLoading ? <ActivityIndicator /> : null}
            {!isLoading && data.length === 0 ? (
              <Text className="text-sm text-ash-grey-500">{t.reports.noneYet}</Text>
            ) : null}
            {data.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                viewLabel={t.reports.viewReport}
                onView={() => openReport(report)}
              />
            ))}
          </View>
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
