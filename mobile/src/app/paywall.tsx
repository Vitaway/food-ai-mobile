import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { SubscriptionPaywall } from '@/components/subscription/SubscriptionPaywall';
import { useSubscriptionAccess } from '@/context/SubscriptionAccessContext';
import { useToast } from '@/context/ToastContext';
import {
  createConsumerCheckout,
  fetchCheckoutStatus,
  fetchSubscriptionPlans,
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

/** Root transparent-modal paywall — Home stays visible behind the sheet. */
export default function PaywallScreen() {
  const router = useRouter();
  const toast = useToast();
  const { hasActiveSubscription, refreshSubscriptionAccess } = useSubscriptionAccess();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [selectedPlanCode, setSelectedPlanCode] = useState('individual_monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCheckoutRef, setPendingCheckoutRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dismiss = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)' as Href);
  };

  const load = async (opts?: { enterIfAllowed?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const allowed = await refreshSubscriptionAccess();
      const planList = await fetchSubscriptionPlans().catch(() => FALLBACK_PLANS);
      const publicOnly = (planList.length ? planList : FALLBACK_PLANS).filter(
        (p) => p.subscriptionType !== 'corporate',
      );
      if (publicOnly.length) {
        setPlans(publicOnly);
        setSelectedPlanCode((current) =>
          publicOnly.some((p) => p.code === current) ? current : 'individual_monthly',
        );
      }

      if (pendingCheckoutRef) {
        const checkoutStatus = await fetchCheckoutStatus(pendingCheckoutRef).catch(() => null);
        if (checkoutStatus?.status === 'succeeded' || allowed) {
          setPendingCheckoutRef(null);
          if (checkoutStatus?.status === 'succeeded') {
            toast.success('Payment confirmed; subscription active');
          }
        }
      }

      if (allowed && opts?.enterIfAllowed) {
        router.replace('/(tabs)' as Href);
      }
    } catch {
      setError('Unable to load plans right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasActiveSubscription) {
      router.replace('/profile/subscription' as Href);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / paid redirect
  }, [hasActiveSubscription]);

  const pickerPlans = useMemo(() => plans, [plans]);

  const startCheckout = async (plan: SubscriptionPlan) => {
    setCheckingOut(true);
    try {
      const checkout = await createConsumerCheckout({ planCode: plan.code });
      if (!checkout.checkoutUrl) {
        toast.error('Checkout URL not available yet');
        return;
      }
      setPendingCheckoutRef(checkout.externalRef);
      await Linking.openURL(checkout.checkoutUrl);
      toast.success('Opening secure payment. Come back and tap Refresh when done.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start checkout. Your account was not charged.'));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <SubscriptionPaywall
        plans={pickerPlans}
        selectedPlanCode={selectedPlanCode}
        checkingOut={checkingOut}
        refreshing={refreshing}
        error={error}
        isLoading={isLoading}
        onDismiss={dismiss}
        onSelectPlan={setSelectedPlanCode}
        onSubscribe={(plan) => void startCheckout(plan)}
        onRefresh={() => {
          setRefreshing(true);
          void load({ enterIfAllowed: true }).finally(() => setRefreshing(false));
        }}
      />
    </View>
  );
}
