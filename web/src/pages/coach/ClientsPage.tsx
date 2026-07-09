import { Link } from 'react-router-dom';
import { CohortFilter } from '@/components/coach/CohortFilter';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { useCoachClients } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { cn, formatCoachPatientLabel, formatRelativeTime } from '@/lib/utils';

const TREND_STYLES = {
  improving: 'text-shamrock-600',
  declining: 'text-red-600',
  stable: 'text-ash-grey-500',
} as const;

export function ClientsPage() {
  const cohortId = useCoachStore((s) => s.cohortId);
  const { data: clients, isLoading } = useCoachClients(cohortId ?? undefined);

  const sorted = [...(clients ?? [])].sort((a, b) => {
    const aReview = a.inReviewCount ?? 0;
    const bReview = b.inReviewCount ?? 0;
    if (bReview !== aReview) return bReview - aReview;
    const aTime = a.lastMealAt ? new Date(a.lastMealAt).getTime() : 0;
    const bTime = b.lastMealAt ? new Date(b.lastMealAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Clients"
        actions={<CohortFilter />}
      />

      {isLoading ? (
        <p className="text-ash-grey-500">Loading clients…</p>
      ) : sorted.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-ash-grey-100 bg-ash-grey-50 text-xs text-ash-grey-500">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Health score</th>
                  <th className="px-4 py-3 font-semibold">Adherence</th>
                  <th className="px-4 py-3 font-semibold">Allergies</th>
                  <th className="px-4 py-3 font-semibold">Flags</th>
                  <th className="px-4 py-3 font-semibold">Last log</th>
                  <th className="px-4 py-3 font-semibold">Today</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((client) => {
                  const allergies = client.profile.allergies ?? [];
                  const trend = client.adherenceTrend ?? 'stable';
                  return (
                    <tr key={client.patientId} className="border-b border-ash-grey-50 last:border-0 hover:bg-ash-grey-50/50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/coach/clients/${client.patientId}`}
                          className="font-semibold text-blue-spruce-700 hover:underline">
                          {formatCoachPatientLabel(client.patientId, client.profile.displayName)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{client.dashboard.healthScore ?? 0}</td>
                      <td className={cn('px-4 py-3 capitalize', TREND_STYLES[trend])}>{trend}</td>
                      <td className="px-4 py-3">
                        {allergies.length ? (
                          <div className="flex flex-wrap gap-1">
                            {allergies.slice(0, 2).map((a) => (
                              <span key={a} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                                {a}
                              </span>
                            ))}
                            {allergies.length > 2 ? (
                              <span className="text-xs text-ash-grey-400">+{allergies.length - 2}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-ash-grey-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(client.inReviewCount ?? 0) > 0 ? (
                            <span className="rounded-full bg-cinnamon-wood-100 px-2 py-0.5 text-xs font-semibold text-cinnamon-wood-700">
                              {client.inReviewCount} review
                            </span>
                          ) : null}
                          {(client.unreadMessages ?? 0) > 0 ? (
                            <span className="rounded-full bg-blue-spruce-100 px-2 py-0.5 text-xs font-semibold text-blue-spruce-700">
                              {client.unreadMessages} msg
                            </span>
                          ) : null}
                          {(client.openFlags ?? 0) === 0 &&
                          !(client.inReviewCount ?? 0) &&
                          !(client.unreadMessages ?? 0) ? (
                            <span className="text-ash-grey-400">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ash-grey-600">
                        {client.lastMealAt ? formatRelativeTime(client.lastMealAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-ash-grey-600">
                        {client.dashboard.caloriesConsumed} / {client.dashboard.calorieTarget} kcal
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardBody className="py-16 text-center text-ash-grey-500">
            No patients on your caseload yet. Review meals from the queue and tap &quot;Add to my caseload&quot; when you take ownership.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
