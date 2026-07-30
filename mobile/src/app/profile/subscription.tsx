import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { StackScreenBody, ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { useToast } from '@/context/ToastContext';
import { useProfileBack } from '@/hooks/useProfileBack';
import {
  addFamilyMember,
  createConsumerCheckout,
  fetchConsumerSubscription,
  fetchFamilySubscription,
  fetchSubscriptionPlans,
  type ConsumerSubscription,
  type SubscriptionPlan,
} from '@/services/remote/consumerApi';

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
    label: 'Family (up to 6)',
    amount: 35000,
    currency: 'RWF',
    subscriptionType: 'family',
    intervalDays: 30,
  },
];

function planPeriodLabel(plan: SubscriptionPlan): string {
  if (plan.intervalDays === 7) return 'week';
  if (plan.intervalDays === 30 || !plan.intervalDays) return 'month';
  return `${plan.intervalDays} days`;
}

export default function SubscriptionScreen() {
  const handleBack = useProfileBack();
  const toast = useToast();
  const [data, setData] = useState<ConsumerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [familyMemberEmail, setFamilyMemberEmail] = useState('');
  const [family, setFamily] = useState<Awaited<ReturnType<typeof fetchFamilySubscription>>>(null);

  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    void Promise.all([
      fetchConsumerSubscription(),
      fetchFamilySubscription(),
      fetchSubscriptionPlans().catch(() => FALLBACK_PLANS),
    ])
      .then(([sub, familyPlan, planList]) => {
        setData(sub);
        setFamily(familyPlan);
        const publicOnly = (planList.length ? planList : FALLBACK_PLANS).filter(
          (p) => p.subscriptionType !== 'corporate',
        );
        if (publicOnly.length) setPlans(publicOnly);
      })
      .catch(() => setError('Unable to load subscription details.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startCheckout = async (plan: SubscriptionPlan) => {
    setCheckingOut(true);
    try {
      const checkout = await createConsumerCheckout({
        planCode: plan.code,
      });
      if (!checkout.checkoutUrl) {
        toast.error('Checkout URL not available yet');
        return;
      }
      await Linking.openURL(checkout.checkoutUrl);
      toast.success('Opening secure payment page');
      load();
    } catch {
      toast.error('Could not start checkout. Your account was not charged.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title="Subscription" onBack={handleBack} />
      <StackScreenBody className="px-5 pt-6">
        {isLoading ? <ActivityIndicator /> : null}
        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
        {!isLoading && !error ? (
          <View className="gap-4">
            <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4">
              <Text className="text-base font-semibold text-ash-grey-900">
                {data?.planCode ?? 'No active subscription'}
              </Text>
              <Text className="mt-2 text-sm text-ash-grey-600">Status: {data?.status ?? 'inactive'}</Text>
              <Text className="mt-1 text-sm text-ash-grey-600">
                Type: {data?.subscriptionType ?? 'individual'}
              </Text>
              <Text className="mt-1 text-sm text-ash-grey-600">
                Renews: {data?.renewsOn ? new Date(data.renewsOn).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            {plans.map((plan) => (
              <Pressable
                key={plan.code}
                onPress={() => void startCheckout(plan)}
                disabled={checkingOut}
                className="rounded-2xl border border-blue-spruce-100 bg-blue-spruce-50 p-4">
                <Text className="font-sans-semibold text-blue-spruce-800">{plan.label}</Text>
                <Text className="mt-1 text-sm text-blue-spruce-700">
                  {plan.amount.toLocaleString()} {plan.currency} / {planPeriodLabel(plan)}
                </Text>
              </Pressable>
            ))}

            {family ? (
              <View className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 p-4 gap-2">
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
                  className="rounded-xl border border-ash-grey-200 px-3 py-2 text-sm"
                />
                <Button
                  label="Add family member"
                  onPress={() => {
                    void addFamilyMember(familyMemberEmail.trim())
                      .then(() => {
                        toast.success('Member added');
                        setFamilyMemberEmail('');
                        load();
                      })
                      .catch(() => toast.error('Could not add member'));
                  }}
                />
              </View>
            ) : null}

            <Button
              label={checkingOut ? 'Starting checkout…' : 'Refresh status'}
              variant="secondary"
              onPress={load}
              disabled={checkingOut}
              fullWidth
            />
          </View>
        ) : null}
      </StackScreenBody>
    </View>
  );
}
