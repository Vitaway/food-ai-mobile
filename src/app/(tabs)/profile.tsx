import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { useAppLock } from '@/context/AppLockContext';
import { useProfile } from '@/context/ProfileContext';
import { useSinglePress } from '@/hooks/useSinglePress';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { isEnabled: passcodeEnabled, biometricsEnabled, biometricLabel, lock } = useAppLock();

  const handleLockApp = useSinglePress(() => {
    if (passcodeEnabled) {
      lock();
      return;
    }

    Alert.alert(
      'Passcode required',
      'Set up a passcode in Security to lock the app.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Security', onPress: () => router.push('/profile/security') },
      ],
    );
  });

  const displayName = profile?.displayName?.trim() || 'Your profile';
  const initial = displayName.slice(0, 1).toUpperCase() || '?';
  const updatedAt = profile
    ? new Date(profile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar
        title="Profile"
        rightAction={
          <Pressable
            onPress={handleLockApp}
            accessibilityRole="button"
            accessibilityLabel={passcodeEnabled ? 'Lock app' : 'Set up passcode to lock app'}
            className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 active:opacity-90">
            <Ionicons name="power" size={22} color="#ffffff" />
          </Pressable>
        }
      />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-0 pt-4">
          <ProfileHeroCard
            displayName={displayName}
            subtitle={updatedAt ?? ''}
            avatarUrl={profile?.avatarUrl}
            initial={initial}
          />

          <ProfileSection title="Account">
            <ProfileMenuRow
              icon="person-circle-outline"
              title="Account"
              onPress={() => router.push('/profile/account')}
            />
          </ProfileSection>

          <ProfileSection title="Health">
            <ProfileMenuRow icon="fitness-outline" title="Health profile" onPress={() => router.push('/profile/health')} />
          </ProfileSection>

          <ProfileSection title="Security">
            <ProfileMenuRow
              icon="lock-closed-outline"
              title={
                passcodeEnabled
                  ? biometricsEnabled
                    ? `Passcode · ${biometricLabel}`
                    : 'Passcode · On'
                  : 'Passcode'
              }
              onPress={() => router.push('/profile/security')}
            />
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
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
