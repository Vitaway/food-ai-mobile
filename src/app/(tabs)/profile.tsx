import { ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { Button } from '@/components/ui/Button';
import { ContentSheet, GradientHeader } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';

const profileFields = [
  { label: 'Goal', value: 'Lose weight' },
  { label: 'Activity', value: 'Moderately active' },
  { label: 'Calorie target', value: '2,100 kcal / day' },
  { label: 'Dietary preferences', value: 'None set' },
];

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-blue-spruce-500">
      <GradientHeader>
        <Text className="font-sans-bold text-3xl text-white">Profile</Text>
        <Text className="mt-1 text-base text-white/85">Health profile and preferences</Text>
      </GradientHeader>

      <ContentSheet>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5"
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}>
          <View className="rounded-3xl bg-ash-grey-50 p-5">
            <Text className="font-sans-semibold text-lg text-neutral-900">Health profile</Text>
            <View className="mt-4 gap-4">
              {profileFields.map((field) => (
                <View key={field.label} className="flex-row items-center justify-between gap-4">
                  <Text className="text-neutral-500">{field.label}</Text>
                  <Text className="flex-1 text-right font-sans-medium text-neutral-800">{field.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <Button label="Edit health profile" variant="outline" />
          <Button label="Notification preferences" variant="ghost" />
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
