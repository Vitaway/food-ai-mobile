import { useRouter, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { Button } from '@/components/ui/Button';
import { ContentSheet, GradientHeader } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { formatActivityLevel, formatHealthGoal } from '@/constants/profileOptions';
import { formatUserSex } from '@/components/onboarding/SexSelector';
import { useProfile } from '@/context/ProfileContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  const profileFields = profile
    ? [
        { label: 'Name', value: profile.displayName ?? 'Not set' },
        { label: 'Sex', value: formatUserSex(profile.sex) },
        { label: 'Goal', value: formatHealthGoal(profile.goal) },
        { label: 'Activity', value: formatActivityLevel(profile.activityLevel) },
        { label: 'Calorie target', value: `${profile.macroTargets.calories.toLocaleString()} kcal / day` },
        { label: 'Protein target', value: `${profile.macroTargets.proteinG} g / day` },
        { label: 'Water target', value: `${profile.waterTargetMl.toLocaleString()} ml / day` },
        {
          label: 'Dietary preferences',
          value: profile.dietaryPreferences.length ? profile.dietaryPreferences.join(', ') : 'None set',
        },
        { label: 'BMR / TDEE', value: `${profile.bmr} / ${profile.tdee} kcal` },
      ]
    : [];

  return (
    <View className="flex-1 bg-white">
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

          <Button label="Edit health profile" variant="outline" onPress={() => router.push('/onboarding' as Href)} />
          <Button label="Notification preferences" variant="ghost" />
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
