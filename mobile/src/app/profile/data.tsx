import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { Alert, ScrollView, Share, View } from 'react-native';

import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/site';
import { useProfileBack } from '@/hooks/useProfileBack';
import { useAuth } from '@/context/AuthContext';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';

function openLegalUrl(url: string) {
  void Linking.openURL(url);
}

export default function DataPrivacyScreen() {
  const router = useRouter();
  const handleBack = useProfileBack();
  const toast = useToast();
  const { logout } = useAuth();
  const { resetNutritionData, deleteAccount, exportData } = useProfile();
  const { clearAllMeals } = useMeals();

  const handleResetData = () => {
    Alert.alert('Reset nutrition data?', 'Meals and hydration logs will be cleared on this device.', [
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

  const handleExport = async () => {
    try {
      const payload = await exportData();
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'MiraFood data export',
      });
      toast.success('Export ready');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your MiraFood account and server data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete everything on the server?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete forever',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteAccount();
                    await clearAllMeals();
                    await logout();
                    router.replace('/auth/login' as Href);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Delete failed');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
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
            <ProfileMenuRow
              icon="download-outline"
              title="Export my data"
              subtitle="Download a copy of your profile and meals"
              onPress={() => void handleExport()}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
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
