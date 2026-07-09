import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { apiRequest } from '@/lib/apiClient';

type PaymentSummary = {
  totalRevenue: number;
  mtdRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  succeededPayments: number;
  activeSubscriptions: number;
  subscriptionsByType: {
    individual: number;
    corporate: number;
    family: number;
  };
  upcomingRenewals: Array<{
    id: string;
    planCode: string;
    subscriptionType: string;
    renewsOn: string;
  }>;
  recentPayments: Array<{
    id: string;
    externalRef: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
};

export function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => apiRequest<PaymentSummary>('/payments/summary'),
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Payments" />
      {isLoading ? <p className="text-sm text-ash-grey-500">Loading payment summary...</p> : null}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardBody><p className="text-sm text-ash-grey-500">Total revenue</p><p className="text-2xl font-bold">{data.totalRevenue.toLocaleString()}</p></CardBody></Card>
            <Card><CardBody><p className="text-sm text-ash-grey-500">MTD revenue</p><p className="text-2xl font-bold">{data.mtdRevenue.toLocaleString()}</p></CardBody></Card>
            <Card><CardBody><p className="text-sm text-ash-grey-500">Active subscriptions</p><p className="text-2xl font-bold">{data.activeSubscriptions}</p></CardBody></Card>
            <Card><CardBody><p className="text-sm text-ash-grey-500">Pending / failed</p><p className="text-2xl font-bold">{data.pendingPayments} / {data.failedPayments}</p></CardBody></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardBody><p className="text-sm text-ash-grey-500">Individual</p><p className="text-xl font-bold">{data.subscriptionsByType.individual}</p></CardBody></Card>
            <Card><CardBody><p className="text-sm text-ash-grey-500">Corporate</p><p className="text-xl font-bold">{data.subscriptionsByType.corporate}</p></CardBody></Card>
            <Card><CardBody><p className="text-sm text-ash-grey-500">Family</p><p className="text-xl font-bold">{data.subscriptionsByType.family}</p></CardBody></Card>
          </div>
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-ash-grey-900">Upcoming renewals</h3>
              <div className="mt-3 space-y-2">
                {data.upcomingRenewals.length ? (
                  data.upcomingRenewals.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-xl border border-ash-grey-100 px-3 py-2 text-sm">
                      <span className="capitalize">{sub.subscriptionType}</span>
                      <span>{sub.planCode}</span>
                      <span>{new Date(sub.renewsOn).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ash-grey-500">No renewals scheduled.</p>
                )}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-ash-grey-900">Recent payments</h3>
              <div className="mt-3 space-y-2">
                {data.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-ash-grey-100 px-3 py-2 text-sm">
                    <span>{p.externalRef}</span>
                    <span>{p.amount.toLocaleString()} {p.currency}</span>
                    <span className="capitalize">{p.status}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
