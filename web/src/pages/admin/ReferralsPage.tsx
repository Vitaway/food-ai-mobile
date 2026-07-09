import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { fetchAdminReferrals, type AdminReferralRow } from '@/features/admin/api/adminApi';

export function AdminReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: fetchAdminReferrals,
  });

  const rows = data ?? [];
  const totalReferrals = rows.reduce((sum, row) => sum + row.referralCount, 0);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Referrals" />

      {isLoading ? <p className="text-sm text-ash-grey-500">Loading referral stats...</p> : null}

      {rows.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Active referrers</p>
                <p className="text-2xl font-bold">{rows.length}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Total referred signups</p>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Top referrer</p>
                <p className="text-lg font-semibold">
                  {rows.reduce<AdminReferralRow | null>(
                    (best, row) => (!best || row.referralCount > best.referralCount ? row : best),
                    null,
                  )?.displayName ?? '—'}
                </p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-ash-grey-900">Referrer leaderboard</h3>
              <div className="mt-3 space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.userId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ash-grey-100 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-ash-grey-900">{row.displayName}</p>
                      <p className="text-xs text-ash-grey-500">{row.referralCode}</p>
                    </div>
                    <span className="rounded-full bg-blue-spruce-50 px-3 py-1 text-xs font-medium text-blue-spruce-700">
                      {row.referralCount} referred
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      ) : !isLoading ? (
        <p className="text-sm text-ash-grey-500">No referral activity yet.</p>
      ) : null}
    </div>
  );
}
