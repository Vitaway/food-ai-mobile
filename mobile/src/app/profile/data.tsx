import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/site';
import { useProfileBack } from '@/hooks/useProfileBack';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';

function openLegalUrl(url: string) {
  void Linking.openURL(url);
}

export default function DataPrivacyScreen() {
  const router = useRouter();
  const handleBack = useProfileBack();
  const { resetNutritionData, deleteAccount } = useProfile();
  const { clearAllMeals } = useMeals();

  const handleResetData = () => {
    Alert.alert('Reset nutrition data?', 'Meals and hydration logs will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetNutritionData();
          await clearAllMeals();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete account?', 'All data on this device will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete everything?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await deleteAccount();
                await clearAllMeals();
                router.replace('/onboarding' as Href);
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Data & privacy" onBack={handleBack} />

      <StackScreenBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10 pt-5">
          <Text className="mb-3 text-sm leading-5 text-neutral-600">
            Learn how MiraFood handles your data and the terms that apply when you use the app.
          </Text>

          <View className="mb-5 overflow-hidden rounded-2xl border border-ash-grey-100 bg-white">
            <ProfileMenuRow
              icon="document-text-outline"
              title="Terms of use"
              subtitle="Rules for using MiraFood"
              onPress={() => openLegalUrl(TERMS_OF_USE_URL)}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="lock-closed-outline"
              title="Privacy policy"
              subtitle="How we collect and protect your data"
              onPress={() => openLegalUrl(PRIVACY_POLICY_URL)}
            />
          </View>

          <View className="overflow-hidden rounded-2xl border border-ash-grey-100 bg-white">
            <ProfileMenuRow icon="refresh-outline" title="Reset nutrition data" onPress={handleResetData} />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="trash-outline"
              title="Delete account"
              destructive
              onPress={handleDeleteAccount}
            />
          </View>
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
