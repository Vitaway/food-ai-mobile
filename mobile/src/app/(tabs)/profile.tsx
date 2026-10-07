import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ProfileHeroCard } from '@/components/profile/ProfileHeroCard';
import { ProfileMenuRow } from '@/components/profile/ProfileMenuRow';
import { ProfileStatsTiles } from '@/components/profile/ProfileStatsTiles';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { FreePlanBanner } from '@/components/subscription/FreePlanBanner';
import { isApiConfigured } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { tf, useI18n } from '@/context/LocaleContext';
import { useMeals } from '@/context/MealsContext';
import { useProfile } from '@/context/ProfileContext';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';
import { useDashboard } from '@/hooks/useDashboard';
import {
  resolveBalancedPlateForMeal,
  withInferredPlateGroups,
} from '@/types/balancedPlate';
import { todayKey } from '@/utils/dates';
import { formatHealthGoal } from '@/constants/profileOptions';

function Divider() {
  return <View className="mx-4 h-px bg-ash-grey-100" />;
}

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { t, locale, locales } = useI18n();
  const { confirm } = useConfirmDialog();
  const { logout, isAuthenticated } = useAuth();
  const { profile, patientId } = useProfile();
  const { hasActiveSubscription } = useSubscriptionAccess();
  const { meals } = useMeals();
  const { dashboard } = useDashboard(todayKey());

  const displayName = profile?.displayName?.trim() || t.profile.yourProfile;
  const initial = displayName.slice(0, 1).toUpperCase() || '?';
  const updatedAt = profile
    ? new Date(profile.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const mealCount = useMemo(
    () => meals.filter((meal) => meal.status !== 'rejected').length,
    [meals],
  );

  const plateAvg = useMemo(() => {
    const scores: number[] = [];
    for (const meal of meals) {
      if (meal.status === 'rejected') continue;
      const stored = meal.balancedPlate?.score;
      if (typeof stored === 'number') {
        scores.push(stored);
        continue;
      }
      const computed = resolveBalancedPlateForMeal({
        mealType: meal.mealType,
        items: withInferredPlateGroups(meal.items ?? []),
      });
      if (computed) scores.push(computed.score);
    }
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [meals]);

  const streakLabel =
    dashboard.streakDays <= 0
      ? t.home.startStreak
      : dashboard.streakDays === 1
        ? t.profile.streakOneDay
        : tf(t.profile.streakDays, { n: dashboard.streakDays });

  const languageLabel =
    locales.find((entry) => entry.id === locale)?.nativeLabel ?? t.profile.languageSubtitle;

  const healthPlanSubtitle = profile
    ? `${profile.macroTargets.calories.toLocaleString()} kcal · ${formatHealthGoal(profile.goal).toLowerCase()}`
    : t.profile.healthProfileHint;

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
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title={t.profile.title} />

      <StackScreenBody className="bg-ash-grey-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
          contentContainerClassName="pt-4">
          <Pressable
            onPress={() => router.push('/profile/account')}
            accessibilityRole="button"
            accessibilityLabel={t.profile.accountPhoto}>
            <ProfileHeroCard
              displayName={displayName}
              subtitle={
                patientId ? tf(t.profile.patientFile, { id: patientId }) : updatedAt ?? ''
              }
              avatarUrl={profile?.avatarUrl}
              initial={initial}
            />
          </Pressable>

          <View className="mt-4">
            <ProfileStatsTiles
              stats={[
                { label: t.profile.statStreak, value: streakLabel },
                { label: t.profile.statMeals, value: String(mealCount) },
                {
                  label: t.profile.statPlateAvg,
                  value: plateAvg != null ? String(plateAvg) : '—',
                },
              ]}
            />
          </View>

          <View className="mb-4">
            <FreePlanBanner />
          </View>

          <View
            className="overflow-hidden rounded-[24px] border border-ash-grey-100 bg-white"
            style={{
              shadowColor: '#1a3a2a',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 1,
            }}>
            <ProfileMenuRow
              icon="fitness-outline"
              title={t.profile.healthPlan}
              subtitle={healthPlanSubtitle}
              onPress={() => router.push('/profile/health')}
            />
            <Divider />
            <ProfileMenuRow
              icon="language-outline"
              title={t.profile.language}
              subtitle={languageLabel}
              onPress={() => router.push('/profile/language')}
            />
            <Divider />
            <ProfileMenuRow
              icon="notifications-outline"
              title={t.profile.widgetsReminders}
              subtitle={t.profile.widgetsRemindersHint}
              onPress={() => router.push('/widgets')}
            />
            <Divider />
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
            <Divider />
            <ProfileMenuRow
              icon="document-text-outline"
              title={t.profile.reports}
              subtitle={t.profile.reportsHint}
              onPress={() => router.push('/profile/reports')}
            />
            <Divider />
            <ProfileMenuRow
              icon="shield-checkmark-outline"
              title={t.profile.dataPrivacy}
              subtitle={t.profile.dataPrivacyHint}
              onPress={() => router.push('/profile/data')}
            />
          </View>

          {isApiConfigured() && isAuthenticated ? (
            <View className="mt-4 mb-2">
              <ProfileMenuRow
                icon="log-out-outline"
                title={t.profile.signOut}
                destructive
                onPress={handleSignOut}
                className="rounded-[24px] border border-ash-grey-100 bg-white"
              />
            </View>
          ) : null}
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
