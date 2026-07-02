import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { InsightPeriodToggle } from '@/components/analytics/InsightPeriodToggle';
import { InsightsCoachPanel } from '@/components/analytics/InsightsCoachPanel';
import { InsightsDailyChart } from '@/components/analytics/InsightsDailyChart';
import { InsightsHeroCard } from '@/components/analytics/InsightsHeroCard';
import { InsightsMacroPanel } from '@/components/analytics/InsightsMacroPanel';
import { InsightsMealBreakdown } from '@/components/analytics/InsightsMealBreakdown';
import { InsightsStatTiles } from '@/components/analytics/InsightsStatTiles';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { useInsightsData } from '@/hooks/useInsightsData';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';

export default function AnalyticsScreen() {
  const { push } = useNavigateOnce();
  const [period, setPeriod] = useState<7 | 30>(7);
  const { snapshot, coachInsights, mealSwaps, stats, calorieTarget, waterTargetCups } = useInsightsData(period);

  const totalCalories = stats.caloriesByType.reduce((sum, row) => sum + row.calories, 0);

  return (
    <View className="flex-1 bg-white">
      <GradientHeader>
        <GradientHeaderTitle>Insights</GradientHeaderTitle>
      </GradientHeader>

      <ContentSheet style={{ backgroundColor: '#f7f8f5' }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 16 }}>
          <InsightPeriodToggle value={period} onChange={setPeriod} />

          <InsightsHeroCard
            period={period}
            hasData={stats.hasData}
            avgCalories={stats.avgCalories}
            calorieTarget={calorieTarget}
            activeDays={stats.activeDays}
            loggingRate={stats.loggingRate}
          />

          <InsightsStatTiles
            mealsCount={stats.mealsCount}
            avgCalories={stats.avgCalories}
            hydrationRate={stats.hydrationRate}
            avgWaterCups={stats.avgWaterCups}
            waterTargetCups={waterTargetCups}
          />

          <InsightsDailyChart
            points={stats.dailySeries}
            maxCalories={stats.maxDailyCalories}
            calorieTarget={calorieTarget}
          />

          <InsightsMealBreakdown
            rows={stats.caloriesByType}
            maxCalories={stats.maxTypeCalories}
            totalCalories={totalCalories}
          />

          <InsightsMacroPanel macros={stats.macroBars} hasData={stats.hasData} />

          <InsightsCoachPanel
            snapshot={snapshot}
            tips={coachInsights}
            swaps={mealSwaps}
            showSwaps={stats.hasData}
            onLogMeal={() => push('/(tabs)/log')}
          />
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
