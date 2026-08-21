import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, View } from 'react-native';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchCoachProfile } from '@/services/remote/coachApi';

export default function CoachProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { logout, session } = useAuth();
  const [title, setTitle] = useState('Nutrition Coach');
  const [organization, setOrganization] = useState<string | null>(null);

  const displayName = session?.user.displayName?.trim() || 'Coach';
  const initial = displayName.slice(0, 1).toUpperCase() || 'C';
  const email = session?.user.email ?? '';

  useFocusEffect(
    useCallback(() => {
      void fetchCoachProfile()
        .then((profile) => {
          setTitle(profile.jobTitle ?? 'Nutrition Coach');
          setOrganization(profile.organization ?? null);
        })
        .catch(() => {
          /* keep defaults */
        });
    }, []),
  );

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to review meals on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout()
            .then(() => toast.success('Signed out successfully', 'See you soon'))
            .catch(() => toast.error('Could not sign out. Try again.'));
        },
      },
    ]);
  };

  const roleLine = [title, organization].filter(Boolean).join(' · ');

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <GradientHeaderTitle>Profile</GradientHeaderTitle>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>

      <ContentSheet className="flex-1 pt-5">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 8,
            gap: 28,
          }}>
          <ProfileHeroCard
            displayName={displayName}
            subtitle={roleLine}
            detail={email || undefined}
            avatarUrl={session?.user.avatarUrl ?? undefined}
            initial={initial}
          />

          <View className="gap-7">
            <ProfileSection title="Account">
              <ProfileMenuRow
                icon="person-circle-outline"
                title="Edit profile"
                subtitle="Name, title, bio, and photo"
                onPress={() => router.push('/coach/profile/account')}
              />
              <View className="mx-5 h-px bg-ash-grey-100" />
              <ProfileMenuRow
                icon="notifications-outline"
                title="Notification settings"
                subtitle="Push alerts and quiet hours"
                onPress={() => router.push('/coach/profile/notifications')}
              />
              <View className="mx-5 h-px bg-ash-grey-100" />
              <ProfileMenuRow
                icon="lock-closed-outline"
                title="Security"
                subtitle="Change your password"
                onPress={() => router.push('/coach/profile/security')}
              />
            </ProfileSection>

            <ProfileSection title="Session">
              <ProfileMenuRow
                icon="log-out-outline"
                title="Sign out"
                subtitle="Leave this device signed out"
                onPress={handleSignOut}
                destructive
              />
            </ProfileSection>
          </View>
        </ScrollView>
      </ContentSheet>
    </View>
  );
}
