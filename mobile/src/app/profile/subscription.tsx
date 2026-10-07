import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { fonts } from '@/constants/fonts';
import { useI18n } from '@/context/LocaleContext';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';
import { palette, semanticColors } from '@/design-system/colors';
import {
  addFamilyMember,
  createConsumerCheckout,
  fetchCheckoutStatus,
  fetchConsumerPayments,
  fetchConsumerSubscription,
  fetchFamilySubscription,
  fetchSubscriptionPlans,
  resendFamilyInvite,
  revokeFamilyInvite,
  type ConsumerPaymentRow,
  type ConsumerSubscription,
  type SubscriptionPlan,
} from '@/services/remote/consumerApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    code: 'individual_weekly',
    label: 'Weekly',
    amount: 5000,
    currency: 'RWF',
    subscriptionType: 'individual',
    intervalDays: 7,
  },
  {
    code: 'individual_monthly',
    label: 'Monthly',
    amount: 15000,
    currency: 'RWF',
    subscriptionType: 'individual',
    intervalDays: 30,
  },
  {
    code: 'family_monthly',
    label: 'Family',
    amount: 35000,
    currency: 'RWF',
    subscriptionType: 'family',
    intervalDays: 30,
  },
];

const CORE_FEATURES = [
  'AI meal logging & food diary',
  'Personalized calories & macros',
  'Coach-reviewed nutrition plan',
  'Water tracking & insights',
] as const;

const FAMILY_FEATURES = [
  'Everything in Monthly',
  'Up to 6 family members',
  'Shared household coaching',
  'One bill for everyone',
] as const;

function planPeriodLabel(plan: Pick<SubscriptionPlan, 'intervalDays'>): string {
  if (plan.intervalDays === 7) return 'week';
  if (plan.intervalDays === 30 || !plan.intervalDays) return 'month';
  return `${plan.intervalDays} days`;
}

function planSubtitle(plan: SubscriptionPlan): string {
  if (plan.subscriptionType === 'family') return 'Up to 6 members · billed monthly';
  if (plan.intervalDays === 7) return 'Flexible · cancel anytime';
  return 'Best value · cancel anytime';
}

function planFeatures(plan: SubscriptionPlan): readonly string[] {
  return plan.subscriptionType === 'family' ? FAMILY_FEATURES : CORE_FEATURES;
}

function isBestValue(plan: SubscriptionPlan): boolean {
  return plan.code === 'individual_monthly';
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

function formatAccessDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPaidAt(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function planLabelForCode(code: string | null, plans: SubscriptionPlan[]): string {
  if (!code) return 'Subscription';
  return plans.find((p) => p.code === code)?.label ?? code.replace(/_/g, ' ');
}

function monthlyEquivalent(plan: SubscriptionPlan): number | null {
  if (!plan.intervalDays || plan.intervalDays <= 0) return null;
  return Math.round((plan.amount / plan.intervalDays) * 30);
}

type PlanPickerProps = {
  plans: SubscriptionPlan[];
  selectedPlanCode: string;
  currentPlanCode?: string | null;
  checkingOut: boolean;
  isUpgrade: boolean;
  compact?: boolean;
  onSelect: (code: string) => void;
  onPay?: (plan: SubscriptionPlan) => void;
  hideCta?: boolean;
};

function FeatureRow({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-5 w-5 items-center justify-center rounded-full bg-shamrock-500">
        <Ionicons name="checkmark" size={12} color="#ffffff" />
      </View>
      <Text className="flex-1 text-[13px] leading-5 text-ash-grey-800">{label}</Text>
    </View>
  );
}

function PlanPickerBody({
  plans,
  selectedPlanCode,
  currentPlanCode,
  checkingOut,
  isUpgrade,
  onSelect,
  onPay,
  hideCta,
}: PlanPickerProps) {
  const { t } = useI18n();
  const selectedPlan = plans.find((p) => p.code === selectedPlanCode) ?? plans[0] ?? null;
  const canPay = Boolean(selectedPlan && selectedPlan.code !== currentPlanCode && onPay && !hideCta);

  return (
    <View>
      <View className="gap-3">
        {plans.map((plan) => {
          const selected = plan.code === selectedPlan?.code;
          const isCurrent = Boolean(currentPlanCode && plan.code === currentPlanCode);
          const best = isBestValue(plan) && !isCurrent;
          const features = planFeatures(plan);
          const perMonth = monthlyEquivalent(plan);

          return (
            <Pressable
              key={plan.code}
              onPress={() => {
                if (isCurrent) return;
                onSelect(plan.code);
              }}
              disabled={checkingOut || isCurrent}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: isCurrent }}
              className={`overflow-hidden rounded-[22px] border-2 bg-white ${
                isCurrent
                  ? 'border-shamrock-300'
                  : selected
                    ? 'border-blue-spruce-700'
                    : 'border-ash-grey-100'
              }`}
              style={
                selected && !isCurrent
                  ? {
                      shadowColor: palette['blue-spruce'][900],
                      shadowOpacity: 0.08,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 3,
                    }
                  : undefined
              }>
              {best ? (
                <View className="items-start px-4 pt-3">
                  <View className="rounded-full bg-shamrock-500 px-3 py-1">
                    <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-white">
                      Best value
                    </Text>
                  </View>
                </View>
              ) : null}

              <View className={`px-4 ${best ? 'pt-2' : 'pt-4'} pb-4`}>
                <View className="flex-row items-start gap-3">
                  <View
                    className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isCurrent || selected
                        ? 'border-blue-spruce-700 bg-blue-spruce-700'
                        : 'border-ash-grey-300 bg-white'
                    }`}>
                    {isCurrent || selected ? (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    ) : null}
                  </View>

                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="min-w-0 flex-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="font-sans-bold text-[17px] text-ash-grey-900">
                            {plan.label}
                          </Text>
                          {isCurrent ? (
                            <View className="rounded-full bg-shamrock-100 px-2 py-0.5">
                              <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-shamrock-800">
                                Current
                              </Text>
                            </View>
                          ) : null}
                          {plan.subscriptionType === 'family' && !isCurrent ? (
                            <View className="rounded-full bg-blue-spruce-50 px-2 py-0.5">
                              <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-blue-spruce-700">
                                Household
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="mt-1 text-xs leading-4 text-ash-grey-500">
                          {isCurrent ? 'Your active plan' : planSubtitle(plan)}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="font-sans-bold text-[20px] text-ash-grey-900">
                          {formatMoney(plan.amount, plan.currency)}
                        </Text>
                        <Text className="text-xs text-ash-grey-500">
                          / {planPeriodLabel(plan)}
                        </Text>
                        {perMonth != null && plan.intervalDays === 7 ? (
                          <Text className="mt-0.5 text-[10px] text-ash-grey-400">
                            ≈ {formatMoney(perMonth, plan.currency)}/mo
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {(selected || isCurrent) && (
                      <View className="mt-4 gap-2.5 border-t border-ash-grey-100 pt-4">
                        {features.map((feature) => (
                          <FeatureRow key={feature} label={feature} />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {canPay && selectedPlan ? (
        <View className="mt-5">
          <Pressable
            onPress={() => onPay?.(selectedPlan)}
            disabled={checkingOut}
            className="items-center rounded-full bg-blue-spruce-800 px-6 py-4 active:opacity-90"
            style={{
              shadowColor: palette['blue-spruce'][900],
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}>
            {checkingOut ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-[16px] font-sans-bold text-white">
                {`${isUpgrade ? t.subscription.upgradePlan : t.subscription.switchPlan} · ${formatMoney(selectedPlan.amount, selectedPlan.currency)}`}
              </Text>
            )}
          </Pressable>
          <Text className="mt-3 text-center text-[11px] leading-4 text-ash-grey-500">
            Secure checkout with Irembo Pay. Cancel anytime before renewal.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { hasActiveSubscription, refreshSubscriptionAccess } = useSubscriptionAccess();
  const toast = useToast();
  const [data, setData] = useState<ConsumerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [payments, setPayments] = useState<ConsumerPaymentRow[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('individual_monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [familyMemberEmail, setFamilyMemberEmail] = useState('');
  const [family, setFamily] = useState<Awaited<ReturnType<typeof fetchFamilySubscription>>>(null);
  const [pendingCheckoutRef, setPendingCheckoutRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lockedOut = !hasActiveSubscription;
  const isActive = hasActiveSubscription;

  const currentPlan = useMemo(() => {
    if (!data?.planCode) return null;
    return plans.find((p) => p.code === data.planCode) ?? null;
  }, [data?.planCode, plans]);

  const pickerPlans = useMemo(() => {
    if (!isActive || !data?.planCode) return plans;
    return [...plans].sort((a, b) => {
      if (a.code === data.planCode) return 1;
      if (b.code === data.planCode) return -1;
      return 0;
    });
  }, [plans, isActive, data?.planCode]);

  const selectedPlan = useMemo(
    () => pickerPlans.find((p) => p.code === selectedPlanCode) ?? pickerPlans[0] ?? null,
    [pickerPlans, selectedPlanCode],
  );

  const enterApp = () => {
    router.replace('/(tabs)' as Href);
  };

  const preferUpgradeCode = (list: SubscriptionPlan[], currentCode?: string | null) => {
    return (
      list.find((p) => p.code !== currentCode && p.code === 'individual_monthly')?.code ??
      list.find((p) => p.code !== currentCode)?.code ??
      list[0]?.code ??
      'individual_monthly'
    );
  };

  const load = async (checkoutRef?: string | null, opts?: { enterIfAllowed?: boolean }) => {
    setIsLoading(true);
    setError(null);
    const ref = checkoutRef ?? pendingCheckoutRef;
    try {
      const allowed = await refreshSubscriptionAccess();

      const [sub, familyPlan, planList, billing, checkoutStatus] = await Promise.all([
        fetchConsumerSubscription().catch(() => null),
        fetchFamilySubscription().catch(() => null),
        fetchSubscriptionPlans().catch(() => FALLBACK_PLANS),
        fetchConsumerPayments().catch(() => null),
        ref ? fetchCheckoutStatus(ref).catch(() => null) : Promise.resolve(null),
      ]);

      setData(sub ?? billing?.subscription ?? null);
      setFamily(familyPlan);
      setPayments(billing?.payments ?? []);

      const publicOnly = (planList.length ? planList : FALLBACK_PLANS).filter(
        (p) => p.subscriptionType !== 'corporate',
      );
      if (publicOnly.length) {
        setPlans(publicOnly);
        setSelectedPlanCode((current) => {
          const next = preferUpgradeCode(publicOnly, sub?.planCode);
          if (allowed && sub?.planCode && current === sub.planCode) return next;
          if (publicOnly.some((p) => p.code === current)) return current;
          return next;
        });
      }

      if (checkoutStatus?.status === 'succeeded') {
        setPendingCheckoutRef(null);
        setUpgradeOpen(false);
        toast.success('Payment confirmed; subscription active');
      } else if (allowed && ref) {
        setPendingCheckoutRef(null);
        setUpgradeOpen(false);
      }

      if (allowed && opts?.enterIfAllowed) {
        enterApp();
      }
    } catch {
      setError('Unable to load subscription details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only refresh
  }, []);

  useEffect(() => {
    if (lockedOut) {
      router.replace('/paywall' as Href);
    }
  }, [lockedOut, router]);

  const openUpgradeSheet = () => {
    setSelectedPlanCode(preferUpgradeCode(plans, data?.planCode));
    setUpgradeOpen(true);
  };

  const startCheckout = async (plan: SubscriptionPlan) => {
    if (isActive && plan.code === data?.planCode) {
      toast.error('You’re already on this plan. Choose a different one to upgrade.');
      return;
    }
    setCheckingOut(true);
    try {
      const checkout = await createConsumerCheckout({
        planCode: plan.code,
      });
      if (!checkout.checkoutUrl) {
        toast.error('Checkout URL not available yet');
        return;
      }
      setPendingCheckoutRef(checkout.externalRef);
      setUpgradeOpen(false);
      await Linking.openURL(checkout.checkoutUrl);
      toast.success('Opening secure payment. Come back and tap Refresh when done.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start checkout. Your account was not charged.'));
    } finally {
      setCheckingOut(false);
    }
  };

  const openInvoice = (payment: ConsumerPaymentRow) => {
    router.push(`/profile/invoice/${payment.id}` as Href);
  };

  const accessUntil = formatAccessDate(data?.renewsOn);
  const currentPlanLabel = currentPlan?.label ?? data?.planCode?.replace(/_/g, ' ') ?? 'Premium';
  const currentPrice =
    currentPlan != null
      ? `${formatMoney(currentPlan.amount, currentPlan.currency)} / ${planPeriodLabel(currentPlan)}`
      : null;

  if (lockedOut) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }} />
    );
  }

  return (
    <View className="flex-1 bg-ash-grey-50" style={{ backgroundColor: '#f7f8f5' }}>
      <ScreenTopBar title="Subscription" onBack={() => enterApp()} />
      <StackScreenBody className="bg-ash-grey-50 px-0 pt-2">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color={semanticColors.primary} />
          </View>
        ) : null}
        {error ? (
          <View className="px-5 pt-4">
            <Text className="text-sm text-red-500">{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-10 pt-2"
            showsVerticalScrollIndicator={false}>
            <View className="mb-5 overflow-hidden rounded-[28px]">
              <LinearGradient
                colors={[palette['blue-spruce'][800], palette['blue-spruce'][900]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 24 }}>
                <View className="mb-4 flex-row items-center justify-between">
                  <View className="rounded-full bg-shamrock-400/20 px-3 py-1">
                    <Text className="text-xs font-sans-semibold text-shamrock-200">Active plan</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={22} color="#86efac" />
                </View>
                <Text className="font-display text-3xl text-white">{currentPlanLabel}</Text>
                {currentPrice ? (
                  <Text className="mt-2 text-lg font-sans-semibold text-white/90">{currentPrice}</Text>
                ) : null}
                <Text className="mt-3 text-sm leading-5 text-white/75">
                  {accessUntil
                    ? `Paid and active until ${accessUntil}. Full MiraFood access is unlocked.`
                    : 'Paid and active. Full MiraFood access is unlocked.'}
                </Text>
              </LinearGradient>
            </View>

            <View className="mb-5 gap-3">
              <Button label="Continue to MiraFood" fullWidth onPress={() => enterApp()} />
              <Button
                label={t.subscription.switchPlan}
                variant="secondary"
                fullWidth
                onPress={openUpgradeSheet}
              />
            </View>

            <View className="mb-5 rounded-[24px] border border-ash-grey-100 bg-white p-5">
              <Text className="mb-3 font-sans-semibold text-ash-grey-900">Included in your plan</Text>
              <View className="gap-3">
                {planFeatures(currentPlan ?? FALLBACK_PLANS[1]).map((feature) => (
                  <FeatureRow key={feature} label={feature} />
                ))}
              </View>
            </View>

            <View className="mb-5 rounded-[24px] border border-ash-grey-100 bg-white p-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-sans-semibold text-ash-grey-900">Payment history</Text>
                <Text className="text-xs text-ash-grey-500">
                  {payments.length
                    ? `${payments.length} receipt${payments.length === 1 ? '' : 's'}`
                    : ''}
                </Text>
              </View>

              {payments.length === 0 ? (
                <Text className="text-sm text-ash-grey-500">
                  Successful payments will show here. Open an invoice to review it, then download.
                </Text>
              ) : (
                <View className="gap-3">
                  {payments.map((payment) => (
                    <View
                      key={payment.id}
                      className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50/80 px-3 py-3">
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="min-w-0 flex-1">
                          <Text className="font-sans-semibold text-ash-grey-900">
                            {planLabelForCode(payment.planCode, plans)}
                          </Text>
                          <Text className="mt-0.5 text-xs text-ash-grey-500">
                            {formatPaidAt(payment.processedAt ?? payment.createdAt)}
                          </Text>
                          <Text className="mt-1 text-sm text-blue-spruce-800">
                            {formatMoney(payment.amount, payment.currency)}
                          </Text>
                          <Text className="mt-0.5 text-[11px] text-ash-grey-400">
                            {payment.invoiceNumber ?? payment.externalRef}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => openInvoice(payment)}
                          className="items-center rounded-xl bg-blue-spruce-800 px-3 py-2">
                          <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                          <Text className="mt-1 text-[10px] font-sans-semibold text-white">View</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {family ? (
              <View className="mb-5 gap-3 rounded-[24px] border border-ash-grey-100 bg-white p-4">
                <Text className="font-sans-semibold text-ash-grey-900">Family members</Text>
                {family.members.map((member) => (
                  <Text key={member.userId} className="text-sm text-ash-grey-600">
                    {member.displayName} · {member.email} ({member.role})
                  </Text>
                ))}
                {(family.pendingInvites ?? []).length ? (
                  <View className="gap-2 pt-1">
                    <Text className="text-xs font-sans-semibold uppercase tracking-wide text-ash-grey-400">
                      Pending invites
                    </Text>
                    {(family.pendingInvites ?? []).map((invite) => (
                      <View
                        key={invite.id}
                        className="flex-row items-center justify-between gap-2 rounded-2xl bg-ash-grey-50 px-3 py-2">
                        <View className="min-w-0 flex-1">
                          <Text className="text-sm text-ash-grey-800" numberOfLines={1}>
                            {invite.email}
                          </Text>
                          <Text className="text-xs text-ash-grey-500">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            void resendFamilyInvite(invite.id)
                              .then(() => {
                                toast.success('Invite resent');
                                void load();
                              })
                              .catch((err) =>
                                toast.error(getApiErrorMessage(err, 'Could not resend invite')),
                              );
                          }}
                          className="rounded-full bg-white px-3 py-1.5">
                          <Text className="text-xs font-sans-semibold text-blue-spruce-700">
                            Resend
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            void revokeFamilyInvite(invite.id)
                              .then(() => {
                                toast.success('Invite cancelled');
                                void load();
                              })
                              .catch((err) =>
                                toast.error(getApiErrorMessage(err, 'Could not cancel invite')),
                              );
                          }}
                          className="rounded-full bg-white px-3 py-1.5">
                          <Text className="text-xs font-sans-semibold text-red-600">Cancel</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                <TextInput
                  value={familyMemberEmail}
                  onChangeText={setFamilyMemberEmail}
                  placeholder="Invite by email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-3 py-3 text-sm"
                  style={{ fontFamily: fonts.sans }}
                />
                <Text className="text-xs text-ash-grey-500">
                  Existing MiraFood users join immediately. New emails get an invite link.
                </Text>
                <Button
                  label="Invite family member"
                  variant="outline"
                  onPress={() => {
                    const email = familyMemberEmail.trim();
                    if (!email) {
                      toast.error('Enter an email address');
                      return;
                    }
                    void addFamilyMember(email)
                      .then((result) => {
                        if (result.action === 'invited') {
                          toast.success('Invite email sent');
                        } else {
                          toast.success('Member added');
                        }
                        setFamilyMemberEmail('');
                        void load();
                      })
                      .catch((err) =>
                        toast.error(getApiErrorMessage(err, 'Could not invite member')),
                      );
                  }}
                />
              </View>
            ) : null}

            {pendingCheckoutRef ? (
              <Button
                label={refreshing ? 'Checking…' : 'Refresh status'}
                variant="secondary"
                loading={refreshing}
                loadingLabel="Checking…"
                onPress={() => {
                  setRefreshing(true);
                  void load(null, { enterIfAllowed: true }).finally(() => setRefreshing(false));
                }}
                disabled={checkingOut || refreshing}
                fullWidth
              />
            ) : null}
          </ScrollView>
        ) : null}
      </StackScreenBody>

      <Modal
        visible={upgradeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setUpgradeOpen(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <Pressable className="flex-1" onPress={() => setUpgradeOpen(false)} />
          <View
            className="max-h-[88%] rounded-t-3xl bg-[#f7faf8]"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-ash-grey-300" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-sans-bold text-2xl text-ash-grey-900">
                  {t.subscription.switchPlanTitle}
                </Text>
                <Text className="mt-1 text-sm text-ash-grey-600">
                  {t.subscription.switchPlanBody}
                </Text>
              </View>
              <Pressable
                onPress={() => setUpgradeOpen(false)}
                hitSlop={10}
                className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Ionicons name="close" size={22} color="#696e5e" />
              </Pressable>
            </View>

            <ScrollView
              className="px-5"
              contentContainerClassName="pb-4 pt-2"
              showsVerticalScrollIndicator={false}>
              {currentPlan ? (
                <View className="mb-4 rounded-2xl border border-ash-grey-100 bg-white px-4 py-3">
                  <Text className="text-xs font-sans-semibold uppercase tracking-wide text-ash-grey-500">
                    Current plan
                  </Text>
                  <Text className="mt-1 font-sans-semibold text-ash-grey-900">
                    {currentPlan.label}
                    {currentPrice ? ` · ${currentPrice}` : ''}
                  </Text>
                </View>
              ) : null}

              <PlanPickerBody
                plans={pickerPlans}
                selectedPlanCode={selectedPlanCode}
                currentPlanCode={data?.planCode}
                checkingOut={checkingOut}
                isUpgrade={false}
                onSelect={setSelectedPlanCode}
                onPay={(plan) => void startCheckout(plan)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
