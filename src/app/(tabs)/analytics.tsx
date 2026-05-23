import { ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';

const insightSections = [
  {
    title: 'Calorie distribution',
    description: 'Compare intake across breakfast, lunch, dinner, and snacks.',
    metric: '32% dinner',
  },
  {
    title: 'Macro trends',
    description: 'Track protein, carbs, fats, and fiber against your targets.',
    metric: 'Protein +12%',
  },
  {
    title: 'Habit detection',
    description: 'Surface patterns like weekend carb spikes or missed protein.',
    metric: '3 patterns',
  },
];

export default function AnalyticsScreen() {
  return (
    <View className="flex-1 bg-blue-spruce-500">
      <GradientHeader>
        <Text className="font-sans-bold text-3xl text-white">Insights</Text>
        <Text className="mt-1 text-base text-white/85">Weekly and monthly nutrition trends</Text>
      </GradientHeader>

      <ContentSheet>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4"
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}>
          {insightSections.map((section) => (
            <View key={section.title} className="rounded-3xl bg-ash-grey-50 p-5">
              <View className="flex-row items-start justify-between gap-3">
                <Text className="flex-1 font-sans-semibold text-lg text-neutral-900">{section.title}</Text>
                <View className="rounded-full bg-blue-spruce-100 px-3 py-1">
                  <Text className="text-xs font-sans-semibold text-blue-spruce-800">{section.metric}</Text>
                </View>
              </View>
              <Text className="mt-2 text-sm leading-6 text-neutral-600">{section.description}</Text>
            </View>
          ))}
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
