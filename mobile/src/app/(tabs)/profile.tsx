import { useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { logout, isAuthenticated } = useAuth();
  const { profile, patientId } = useProfile();

  const displayName = profile?.displayName?.trim() || 'Your profile';
  const initial = displayName.slice(0, 1).toUpperCase() || '?';
  const updatedAt = profile
    ? new Date(profile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your meals and profile.', [
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

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Profile" />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-0 pt-4">
          <ProfileHeroCard
            displayName={displayName}
            subtitle={patientId ? `Patient file · ${patientId}` : updatedAt ?? ''}
            avatarUrl={profile?.avatarUrl}
            initial={initial}
          />

          <ProfileSection title="Account">
            <ProfileMenuRow
              icon="person-circle-outline"
              title="Account"
              onPress={() => router.push('/profile/account')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="gift-outline"
              title="Invite friends"
              onPress={() => router.push('/referral')}
            />
          </ProfileSection>

          <ProfileSection title="Health">
            <ProfileMenuRow icon="fitness-outline" title="Health profile" onPress={() => router.push('/profile/health')} />
          </ProfileSection>

          <ProfileSection title="Preferences">
            <ProfileMenuRow
              icon="notifications-outline"
              title="Notification settings"
              onPress={() => router.push('/profile/notifications')}
            />
          </ProfileSection>

          <ProfileSection title="More">
            <ProfileMenuRow icon="bar-chart-outline" title="Insights" onPress={() => router.push('/(tabs)/analytics')} />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="mail-outline"
              title="Notifications"
              onPress={() => router.push('/notifications')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow icon="shield-checkmark-outline" title="Data & privacy" onPress={() => router.push('/profile/data')} />
          </ProfileSection>

          {isApiConfigured() && isAuthenticated ? (
            <ProfileSection title="Session">
              <ProfileMenuRow
                icon="log-out-outline"
                title="Sign out"
                subtitle="Switch account or sign in again"
                destructive
                onPress={handleSignOut}
              />
            </ProfileSection>
          ) : null}
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
