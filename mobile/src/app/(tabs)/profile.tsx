import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { tf, useI18n } from '@/context/LocaleContext';
import { useProfile } from '@/context/ProfileContext';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const { confirm } = useConfirmDialog();
  const { logout, isAuthenticated } = useAuth();
  const { profile, patientId } = useProfile();
  const { hasActiveSubscription } = useSubscriptionAccess();

  const displayName = profile?.displayName?.trim() || t.profile.yourProfile;
  const initial = displayName.slice(0, 1).toUpperCase() || '?';
  const updatedAt = profile
    ? new Date(profile.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleSignOut = () => {
    void confirm({
      title: t.profile.signOutConfirmTitle,
      message: t.profile.signOutConfirmBody,
      confirmLabel: t.profile.signOut,
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      void logout()
        .then(() => toast.success(t.profile.signedOut, t.profile.seeYouSoon))
        .catch(() => toast.error(t.common.tryAgain));
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title={t.profile.title} />

      <StackScreenBody>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="gap-0 pt-4">
          <ProfileHeroCard
            displayName={displayName}
            subtitle={
              patientId ? tf(t.profile.patientFile, { id: patientId }) : updatedAt ?? ''
            }
            avatarUrl={profile?.avatarUrl}
            initial={initial}
          />

          <View className="mb-4 mt-4">
            <FreePlanBanner />
          </View>

          <ProfileSection title={t.profile.sectionAccount}>
            <ProfileMenuRow
              icon="person-circle-outline"
              title={t.profile.accountPhoto}
              subtitle={t.profile.accountPhotoHint}
              onPress={() => router.push('/profile/account')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="gift-outline"
              title={t.profile.inviteFriends}
              onPress={() => router.push('/referral')}
            />
          </ProfileSection>

          <ProfileSection title={t.profile.sectionHealth}>
            <ProfileMenuRow
              icon="fitness-outline"
              title={t.profile.healthProfile}
              subtitle={t.profile.healthProfileHint}
              onPress={() => router.push('/profile/health')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="create-outline"
              title={t.profile.editHealth}
              subtitle={t.profile.editHealthHint}
              onPress={() => router.push('/profile/edit-health')}
            />
          </ProfileSection>

          {isApiConfigured() && isAuthenticated ? (
            <ProfileSection title={t.profile.sectionCareTeam}>
              <ProfileMenuRow
                icon="chatbubbles-outline"
                title={t.profile.messageCoach}
                subtitle={t.profile.messageCoachHint}
                onPress={() => router.push('/(tabs)/chat')}
              />
            </ProfileSection>
          ) : null}

          <ProfileSection title={t.profile.preferences}>
            <ProfileMenuRow
              icon="language-outline"
              title={t.profile.language}
              subtitle={t.profile.languageSubtitle}
              onPress={() => router.push('/profile/language')}
            />
          </ProfileSection>

          <ProfileSection title={t.profile.sectionMore}>
            <ProfileMenuRow
              icon="bar-chart-outline"
              title={t.profile.insights}
              onPress={() => router.push('/(tabs)/analytics')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="wallet-outline"
              title={t.profile.subscription}
              subtitle={
                hasActiveSubscription
                  ? t.profile.subscriptionHintPaid
                  : t.profile.subscriptionHintFree
              }
              onPress={() =>
                router.push(hasActiveSubscription ? '/profile/subscription' : '/paywall')
              }
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="document-text-outline"
              title={t.profile.reports}
              subtitle={t.profile.reportsHint}
              onPress={() => router.push('/profile/reports')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="mail-outline"
              title={t.profile.notifications}
              onPress={() => router.push('/notifications')}
            />
            <View className="mx-4 h-px bg-ash-grey-100" />
            <ProfileMenuRow
              icon="shield-checkmark-outline"
              title={t.profile.dataPrivacy}
              onPress={() => router.push('/profile/data')}
            />
          </ProfileSection>

          {isApiConfigured() && isAuthenticated ? (
            <ProfileSection title={t.profile.sectionSession}>
              <ProfileMenuRow
                icon="log-out-outline"
                title={t.profile.signOut}
                subtitle={t.profile.signOutHint}
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
