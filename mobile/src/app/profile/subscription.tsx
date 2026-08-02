import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { StackScreenBody, ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';
import { semanticColors } from '@/design-system/colors';
import {
  addFamilyMember,
  createConsumerCheckout,
  fetchCheckoutStatus,
  fetchConsumerPayments,
  fetchConsumerSubscription,
  fetchFamilySubscription,
  fetchSubscriptionPlans,
  type ConsumerPaymentRow,
  type ConsumerSubscription,
  type SubscriptionPlan,
} from '@/services/remote/consumerApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { downloadPaymentReceiptPdf } from '@/utils/paymentReceipt';

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

const PLAN_FEATURES = [
  'AI meal logging & diary',
  'Coach-reviewed nutrition',
  'Water & macro tracking',
  'Insights and reports',
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

type PlanPickerProps = {
  plans: SubscriptionPlan[];
  selectedPlanCode: string;
  currentPlanCode?: string | null;
  checkingOut: boolean;
  isUpgrade: boolean;
  onSelect: (code: string) => void;
  onPay: (plan: SubscriptionPlan) => void;
};

function PlanPickerBody({
  plans,
  selectedPlanCode,
  currentPlanCode,
  checkingOut,
  isUpgrade,
  onSelect,
  onPay,
}: PlanPickerProps) {
  const selectedPlan = plans.find((p) => p.code === selectedPlanCode) ?? plans[0] ?? null;
  const canPay = selectedPlan && selectedPlan.code !== currentPlanCode;

  return (
    <View>
      <View className="gap-3">
        {plans.map((plan) => {
          const selected = plan.code === selectedPlan?.code;
          const isCurrent = Boolean(currentPlanCode && plan.code === currentPlanCode);
          const popular = plan.code === 'individual_monthly' && !isCurrent;
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
              className={`rounded-3xl border-2 bg-white p-4 ${
                isCurrent
                  ? 'border-shamrock-300 bg-shamrock-50/40'
                  : selected
                    ? 'border-blue-spruce-600'
                    : 'border-ash-grey-100'
              }`}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="font-sans-semibold text-base text-ash-grey-900">
                      {plan.label}
                    </Text>
                    {isCurrent ? (
                      <View className="rounded-full bg-shamrock-100 px-2 py-0.5">
                        <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-shamrock-800">
                          Current
                        </Text>
                      </View>
                    ) : null}
                    {popular ? (
                      <View className="rounded-full bg-cinnamon-wood-100 px-2 py-0.5">
                        <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-cinnamon-wood-700">
                          Popular
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mt-1 text-xs text-ash-grey-500">
                    {isCurrent ? 'Your active plan' : planSubtitle(plan)}
                  </Text>
                  <Text className="mt-3 text-2xl font-sans-semibold text-blue-spruce-800">
                    {formatMoney(plan.amount, plan.currency)}
                    <Text className="text-sm font-sans text-ash-grey-500">
                      {' '}
                      / {planPeriodLabel(plan)}
                    </Text>
                  </Text>
                </View>
                {!isCurrent ? (
                  <View
                    className={`mt-1 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      selected
                        ? 'border-blue-spruce-600 bg-blue-spruce-600'
                        : 'border-ash-grey-300 bg-white'
                    }`}>
                    {selected ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                  </View>
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color={semanticColors.success} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {canPay && selectedPlan ? (
        <View className="mt-5">
          <Button
            label={
              checkingOut
                ? 'Opening checkout…'
                : isUpgrade
                  ? `Upgrade · ${formatMoney(selectedPlan.amount, selectedPlan.currency)}`
                  : `Subscribe · ${formatMoney(selectedPlan.amount, selectedPlan.currency)}`
            }
            loading={checkingOut}
            loadingLabel="Opening checkout…"
            fullWidth
            onPress={() => onPay(selectedPlan)}
            disabled={checkingOut}
          />
          <Text className="mt-3 text-center text-xs leading-4 text-ash-grey-500">
            Secure payment via Irembo Pay. After paying, return here and refresh status.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [familyMemberEmail, setFamilyMemberEmail] = useState('');
  const [family, setFamily] = useState<Awaited<ReturnType<typeof fetchFamilySubscription>>>(null);
  const [pendingCheckoutRef, setPendingCheckoutRef] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
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
        toast.success('Payment confirmed — subscription active');
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

  const downloadReceipt = async (payment: ConsumerPaymentRow) => {
    setDownloadingId(payment.id);
    try {
      await downloadPaymentReceiptPdf(payment.id, { invoiceNumber: payment.invoiceNumber });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download invoice'));
    } finally {
      setDownloadingId(null);
    }
  };

  const accessUntil = formatAccessDate(data?.renewsOn);
  const currentPlanLabel = currentPlan?.label ?? data?.planCode?.replace(/_/g, ' ') ?? 'Premium';
  const currentPrice =
    currentPlan != null
      ? `${formatMoney(currentPlan.amount, currentPlan.currency)} / ${planPeriodLabel(currentPlan)}`
      : null;

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar
        title="Subscription"
        onBack={lockedOut ? undefined : () => enterApp()}
      />
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
            {isActive ? (
              <>
                <View className="mb-5 overflow-hidden rounded-3xl bg-blue-spruce-800">
                  <View className="px-5 pb-5 pt-6">
                    <View className="mb-4 flex-row items-center justify-between">
                      <View className="rounded-full bg-shamrock-400/20 px-3 py-1">
                        <Text className="text-xs font-sans-semibold text-shamrock-200">
                          Active plan
                        </Text>
                      </View>
                      <Ionicons name="shield-checkmark" size={22} color="#86efac" />
                    </View>
                    <Text className="font-display text-3xl text-white">{currentPlanLabel}</Text>
                    {currentPrice ? (
                      <Text className="mt-2 text-lg font-sans-semibold text-white/90">
                        {currentPrice}
                      </Text>
                    ) : null}
                    <Text className="mt-3 text-sm leading-5 text-white/75">
                      {accessUntil
                        ? `Paid and active until ${accessUntil}. Full MiraFood access is unlocked.`
                        : 'Paid and active. Full MiraFood access is unlocked.'}
                    </Text>
                  </View>
                </View>

                <View className="mb-5 gap-3">
                  <Button label="Continue to MiraFood" fullWidth onPress={() => enterApp()} />
                  <Button
                    label="Upgrade or change plan"
                    variant="secondary"
                    fullWidth
                    onPress={openUpgradeSheet}
                  />
                </View>
              </>
            ) : (
              <>
                <View className="mb-6 items-center pt-2">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-spruce-600">
                    <Ionicons name="sparkles" size={36} color="#ffffff" />
                  </View>
                  <Text className="font-display text-center text-3xl text-blue-spruce-900">
                    MiraFood Premium
                  </Text>
                  <Text className="mt-2 max-w-[300px] text-center text-sm leading-5 text-ash-grey-600">
                    Subscribe to unlock meal logging, coaching, and your full nutrition diary.
                  </Text>
                </View>

                <Text className="mb-3 font-sans-semibold text-ash-grey-900">Choose a plan</Text>
                <View className="mb-5">
                  <PlanPickerBody
                    plans={pickerPlans}
                    selectedPlanCode={selectedPlanCode}
                    checkingOut={checkingOut}
                    isUpgrade={false}
                    onSelect={setSelectedPlanCode}
                    onPay={(plan) => void startCheckout(plan)}
                  />
                </View>
              </>
            )}

            <View className="mb-5 rounded-3xl border border-ash-grey-100 bg-white p-5">
              <Text className="mb-3 font-sans-semibold text-ash-grey-900">
                {isActive ? 'Included in your plan' : 'What you get'}
              </Text>
              <View className="gap-3">
                {PLAN_FEATURES.map((feature) => (
                  <View key={feature} className="flex-row items-center gap-3">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-shamrock-100">
                      <Ionicons name="checkmark" size={16} color={semanticColors.success} />
                    </View>
                    <Text className="flex-1 text-sm text-ash-grey-800">{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {isActive ? (
              <View className="mb-5 rounded-3xl border border-ash-grey-100 bg-white p-5">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="font-sans-semibold text-ash-grey-900">Payment history</Text>
                  <Text className="text-xs text-ash-grey-500">
                    {payments.length ? `${payments.length} receipt${payments.length === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>

                {payments.length === 0 ? (
                  <Text className="text-sm text-ash-grey-500">
                    Successful payments will show here with downloadable invoices.
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
                            onPress={() => void downloadReceipt(payment)}
                            disabled={downloadingId === payment.id}
                            className="items-center rounded-xl bg-blue-spruce-800 px-3 py-2">
                            {downloadingId === payment.id ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="download-outline" size={18} color="#ffffff" />
                                <Text className="mt-1 text-[10px] font-sans-semibold text-white">
                                  Invoice
                                </Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {family && isActive ? (
              <View className="mb-5 rounded-3xl border border-ash-grey-100 bg-white p-4 gap-3">
                <Text className="font-sans-semibold text-ash-grey-900">Family members</Text>
                {family.members.map((member) => (
                  <Text key={member.userId} className="text-sm text-ash-grey-600">
                    {member.displayName} ({member.role})
                  </Text>
                ))}
                <TextInput
                  value={familyMemberEmail}
                  onChangeText={setFamilyMemberEmail}
                  placeholder="Add member by email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="rounded-xl border border-ash-grey-200 bg-ash-grey-50 px-3 py-3 text-sm"
                />
                <Button
                  label="Add family member"
                  variant="outline"
                  onPress={() => {
                    void addFamilyMember(familyMemberEmail.trim())
                      .then(() => {
                        toast.success('Member added');
                        setFamilyMemberEmail('');
                        void load();
                      })
                      .catch(() => toast.error('Could not add member'));
                  }}
                />
              </View>
            ) : null}

            <View className="gap-3">
              {(lockedOut || pendingCheckoutRef) && (
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
              )}

              {lockedOut ? (
                <Button
                  label={signingOut ? 'Signing out…' : 'Sign out'}
                  variant="outline"
                  disabled={signingOut}
                  fullWidth
                  onPress={() => {
                    setSigningOut(true);
                    void logout().finally(() => setSigningOut(false));
                  }}
                />
              ) : null}
            </View>
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
            className="max-h-[88%] rounded-t-3xl bg-ash-grey-50"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-ash-grey-300" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-display text-2xl text-blue-spruce-900">
                  Upgrade or change
                </Text>
                <Text className="mt-1 text-sm text-ash-grey-600">
                  Choose a new plan and pay securely. Your current plan stays until payment
                  confirms.
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
                isUpgrade
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
