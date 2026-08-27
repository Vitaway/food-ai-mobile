import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { APP_LOGO } from '@/constants/brand';
import { palette } from '@/design-system/colors';
import type { ConsumerPaymentRow, SubscriptionPlan } from '@/services/remote/consumerApi';

type InvoiceDocumentProps = {
  payment: ConsumerPaymentRow;
  planLabel: string;
  renewsOn?: string | null;
  customerName: string;
  customerEmail: string;
};

function formatMoney(amount: number, currency: string): string {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
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

function formatAccessDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function methodLabel(provider: string): string {
  if (provider.toLowerCase().includes('irembo')) return 'IremboPay';
  if (!provider.trim()) return 'IremboPay';
  return provider;
}

export function planLabelForCode(code: string | null, plans: SubscriptionPlan[]): string {
  if (!code) return 'Subscription';
  return plans.find((p) => p.code === code)?.label ?? code.replace(/_/g, ' ');
}

export function InvoiceDocument({
  payment,
  planLabel,
  renewsOn,
  customerName,
  customerEmail,
}: InvoiceDocumentProps) {
  const navy = palette['blue-spruce'];
  const receiptNumber = payment.invoiceNumber ?? payment.externalRef;

  const rows: Array<{ label: string; value: string }> = [
    { label: payment.invoiceNumber ? 'Invoice' : 'Receipt', value: receiptNumber },
  ];
  if (payment.externalRef && payment.externalRef !== receiptNumber) {
    rows.push({ label: 'Reference', value: payment.externalRef });
  }
  rows.push(
    { label: 'Customer', value: customerName || customerEmail },
    { label: 'Email', value: customerEmail || '—' },
    { label: 'Plan', value: `${planLabel}${payment.planCode ? ` (${payment.planCode})` : ''}` },
    { label: 'Amount paid', value: formatMoney(payment.amount, payment.currency) },
    { label: 'Paid at', value: formatPaidAt(payment.processedAt ?? payment.createdAt) },
    { label: 'Access until', value: formatAccessDate(renewsOn) },
    { label: 'Method', value: methodLabel(payment.provider) },
  );

  return (
    <View
      className="overflow-hidden rounded-[28px] bg-white"
      style={{
        shadowColor: navy[900],
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}>
      <View className="flex-row items-center gap-3 px-5 py-5" style={{ backgroundColor: navy[800] }}>
        <Image source={APP_LOGO} className="h-12 w-12" resizeMode="contain" />
        <View className="min-w-0 flex-1">
          <Text className="font-sans-bold text-xl text-white">MiraFood</Text>
          <Text className="mt-0.5 text-sm text-white/75">Payment receipt</Text>
        </View>
        <Text className="max-w-[38%] text-right text-[11px] text-white/70" numberOfLines={2}>
          {receiptNumber}
        </Text>
      </View>

      <View className="px-5 pb-5 pt-5">
        <Text className="font-sans-bold text-lg text-blue-spruce-900">Thank you for your payment</Text>
        <Text className="mt-1 text-sm leading-5 text-ash-grey-500">
          This confirms your MiraFood subscription payment. Keep this receipt for your records.
        </Text>

        <View className="mt-5 overflow-hidden rounded-2xl border border-ash-grey-100">
          {rows.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              className={`flex-row items-start justify-between gap-3 px-4 py-3 ${
                index < rows.length - 1 ? 'border-b border-ash-grey-100' : ''
              }`}>
              <Text className="w-[38%] text-[11px] font-sans-semibold uppercase tracking-wide text-ash-grey-400">
                {row.label}
              </Text>
              <Text className="min-w-0 flex-1 text-right text-sm font-sans-semibold text-blue-spruce-900">
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-4 rounded-2xl bg-shamrock-50 px-4 py-4">
          <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-shamrock-700">
            Total paid
          </Text>
          <Text className="mt-1 font-sans-bold text-[28px] text-shamrock-800">
            {formatMoney(payment.amount, payment.currency)}
          </Text>
        </View>

        <Text className="mt-5 text-center text-[11px] leading-4 text-ash-grey-400">
          MiraFood by Vitaway Health · Questions? Contact support via mirafood.vitaway.org
        </Text>
      </View>
    </View>
  );
}
