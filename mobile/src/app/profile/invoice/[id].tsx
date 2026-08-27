import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InvoiceDocument, planLabelForCode } from '@/components/subscription/InvoiceDocument';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { palette } from '@/design-system/colors';
import {
  fetchConsumerPayments,
  fetchConsumerSubscription,
  fetchSubscriptionPlans,
  type ConsumerPaymentRow,
  type ConsumerSubscription,
  type SubscriptionPlan,
} from '@/services/remote/consumerApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { downloadPaymentReceiptPdf } from '@/utils/paymentReceipt';

export default function InvoiceViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [payment, setPayment] = useState<ConsumerPaymentRow | null>(null);
  const [subscription, setSubscription] = useState<ConsumerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void Promise.all([fetchConsumerPayments(), fetchConsumerSubscription(), fetchSubscriptionPlans()])
      .then(([payments, sub, planList]) => {
        if (!active) return;
        const found = typeof id === 'string' ? payments.payments.find((row) => row.id === id) : null;
        if (!found) {
          setError('Invoice not found.');
          return;
        }
        setPayment(found);
        setSubscription(sub ?? payments.subscription);
        setPlans(planList);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Could not load this invoice.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/profile/subscription');
  };

  const handleDownload = async () => {
    if (!payment || downloading) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadPaymentReceiptPdf(payment.id, { invoiceNumber: payment.invoiceNumber });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not download invoice'));
    } finally {
      setDownloading(false);
    }
  };

  const navy = palette['blue-spruce'];
  const customerName = session?.user.displayName?.trim() || session?.user.email || 'MiraFood member';
  const customerEmail = session?.user.email ?? '';

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title="Invoice" onBack={handleBack} />
      <StackScreenBody className="bg-ash-grey-50">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={navy[700]} />
          </View>
        ) : !payment ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center font-sans-semibold text-neutral-800">
              {error ?? 'Invoice not found.'}
            </Text>
            <Button label="Back to subscription" className="mt-5" onPress={handleBack} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="px-5 pt-5"
              contentContainerStyle={{ paddingBottom: 24 }}>
              <InvoiceDocument
                payment={payment}
                planLabel={planLabelForCode(payment.planCode, plans)}
                renewsOn={subscription?.renewsOn}
                customerName={customerName}
                customerEmail={customerEmail}
              />
              {error ? <Text className="mt-4 text-center text-sm text-red-500">{error}</Text> : null}
            </ScrollView>
            <View className="px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
              <Button
                label={downloading ? 'Preparing…' : 'Download PDF'}
                variant="primary"
                fullWidth
                loading={downloading}
                onPress={() => void handleDownload()}
              />
            </View>
          </>
        )}
      </StackScreenBody>
    </View>
  );
}
