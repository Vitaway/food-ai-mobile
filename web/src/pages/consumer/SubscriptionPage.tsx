import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getApiBaseUrl } from '@/lib/apiClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  createConsumerCheckout,
  fetchConsumerPayments,
  fetchSubscriptionAccess,
  fetchSubscriptionPlans,
  type ConsumerPaymentRow,
} from '@/features/consumer/api/consumerApi';

function periodLabel(days?: number) {
  if (days === 7) return 'week';
  if (days === 30 || !days) return 'month';
  return `${days} days`;
}

export function ConsumerSubscriptionPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.session?.token);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const { data: access } = useQuery({
    queryKey: ['consumer', 'subscription-access'],
    queryFn: fetchSubscriptionAccess,
  });
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['consumer', 'plans'],
    queryFn: fetchSubscriptionPlans,
  });
  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['consumer', 'payments'],
    queryFn: fetchConsumerPayments,
  });

  const checkout = useMutation({
    mutationFn: (planCode: string) => createConsumerCheckout({ planCode }),
    onSuccess: async (result) => {
      setPendingRef(result.externalRef);
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank', 'noopener,noreferrer');
        toast.success('Payment page opened. Return here and refresh after paying.');
      }
      void qc.invalidateQueries({ queryKey: ['consumer'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not start checkout')),
  });

  const paymentColumns: DataTableColumn<ConsumerPaymentRow>[] = useMemo(
    () => [
      {
        key: 'invoice',
        header: 'Invoice / ref',
        cell: (row) => row.invoiceNumber ?? row.externalRef,
      },
      {
        key: 'plan',
        header: 'Plan',
        cell: (row) => row.planCode ?? '—',
      },
      {
        key: 'amount',
        header: 'Amount',
        cell: (row) => `${row.amount.toLocaleString()} ${row.currency}`,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => <span className="capitalize">{row.status}</span>,
      },
      {
        key: 'date',
        header: 'Date',
        cell: (row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        key: 'receipt',
        header: 'Receipt',
        cell: (row) =>
          row.status === 'succeeded' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const url = `${getApiBaseUrl()}/consumer/payments/${row.id}/receipt`;
                void fetch(url, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                })
                  .then(async (res) => {
                    if (!res.ok) throw new Error('Could not download receipt');
                    const blob = await res.blob();
                    const href = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = href;
                    a.download = `mirafood-receipt-${row.id.slice(0, 8)}.pdf`;
                    a.click();
                    URL.revokeObjectURL(href);
                  })
                  .catch((err) =>
                    toast.error(getApiErrorMessage(err, 'Could not download receipt')),
                  );
              }}>
              PDF
            </Button>
          ) : (
            <span className="text-ash-grey-400">—</span>
          ),
      },
    ],
    [token, toast],
  );

  const sub = billing?.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-ash-grey-900">Subscription</h2>
        <p className="mt-1 text-ash-grey-600">
          Manage your plan, pay securely via IremboPay, and download receipts.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-2">
          <p className="text-sm font-semibold text-ash-grey-900">Current access</p>
          <p className="text-sm text-ash-grey-600">
            Status:{' '}
            <span className="font-medium capitalize">
              {access?.allowed ? 'active' : sub?.status ?? 'inactive'}
            </span>
          </p>
          <p className="text-sm text-ash-grey-600">Plan: {sub?.planCode ?? 'None'}</p>
          <p className="text-sm text-ash-grey-600">
            Access until:{' '}
            {sub?.renewsOn ? new Date(sub.renewsOn).toLocaleDateString() : '—'}
          </p>
          {pendingRef ? (
            <p className="text-sm text-blue-spruce-700">
              Pending checkout {pendingRef}. Refresh this page after completing payment.
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void qc.invalidateQueries({ queryKey: ['consumer'] })}>
            Refresh status
          </Button>
        </CardBody>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-ash-grey-900">Choose a plan</h3>
        {plansLoading ? (
          <p className="text-sm text-ash-grey-500">Loading plans…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.code}>
                <CardBody className="space-y-3">
                  <p className="text-lg font-semibold text-ash-grey-900">{plan.label}</p>
                  <p className="text-2xl font-bold text-blue-spruce-800">
                    {plan.amount.toLocaleString()} {plan.currency}
                    <span className="text-sm font-normal text-ash-grey-500">
                      {' '}
                      / {periodLabel(plan.intervalDays)}
                    </span>
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate(plan.code)}>
                    {checkout.isPending ? 'Opening…' : 'Pay with IremboPay'}
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-ash-grey-900">Payment history & receipts</h3>
        {billingLoading ? (
          <p className="text-sm text-ash-grey-500">Loading payments…</p>
        ) : (
          <Card>
            <CardBody className="p-0 sm:p-0">
              <DataTable
                columns={paymentColumns}
                rows={billing?.payments ?? []}
                rowKey={(row) => row.id}
                emptyTitle="No payments yet"
                emptyDescription="Successful payments appear here with downloadable PDF receipts."
              />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
