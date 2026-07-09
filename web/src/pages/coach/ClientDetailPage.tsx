import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { ClientCoachingInsightsPanel } from '@/components/coach/ClientCoachingInsightsPanel';
import { CoachMessagesPanel } from '@/components/coach/CoachMessagesPanel';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  useAssignClient,
  useCoachClient,
  useCoachClientSummary,
  useUnassignClient,
} from '@/hooks/useCoachQueries';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { formatCoachPatientLabel, formatMealType, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useCoachClient(id ?? null);
  const { data: summary } = useCoachClientSummary(id ?? null);
  const assignMutation = useAssignClient();
  const unassignMutation = useUnassignClient();
  const { data: coachProfile } = useCoachProfile();
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'overview' | 'meals' | 'messages'>('overview');

  function handlePrint() {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Client summary</title></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  }

  async function handleAssign() {
    if (!id) return;
    try {
      await assignMutation.mutateAsync(id);
      toast.success('Client added to your caseload.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not assign client'));
    }
  }

  async function handleUnassign() {
    if (!id) return;
    try {
      await unassignMutation.mutateAsync(id);
      toast.success('Patient removed from your caseload.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update caseload'));
    }
  }

  if (isLoading) return <p className="text-ash-grey-500">Loading client…</p>;

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold">Client not found</p>
        <Link to="/coach/clients" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const { client, meals, assignedCoachIds } = data;
  const isOnCaseload = coachProfile?.id
    ? assignedCoachIds.includes(coachProfile.id)
    : assignedCoachIds.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/coach/clients" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Clients
        </Link>
        <h2 className="text-2xl font-bold text-ash-grey-900">
          {formatCoachPatientLabel(client.patientId, client.profile.displayName)}
        </h2>
        {isOnCaseload ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleUnassign()}
            disabled={unassignMutation.isPending}>
            Remove from my caseload
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => void handleAssign()} disabled={assignMutation.isPending}>
            Add to my caseload
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={handlePrint}>
          Export PDF
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['overview', 'meals', 'messages'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? 'rounded-full bg-blue-spruce-600 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-full border border-ash-grey-200 px-4 py-2 text-sm font-semibold text-ash-grey-700'
            }>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div ref={printRef}>
        {tab === 'overview' ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <ClientPanel client={client} showPreferences />
            <div className="space-y-6">
              <ClientCoachingInsightsPanel clientId={client.patientId} />
              {summary ? (
              <Card>
                <CardHeader>
                  <h3 className="font-bold">Weekly summary</h3>
                  <p className="text-sm text-ash-grey-500">Since {summary.weekStart}</p>
                </CardHeader>
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  <Stat label="Days logged" value={String(summary.daysLogged)} />
                  <Stat label="Meals submitted" value={String(summary.mealsSubmitted)} />
                  <Stat label="Approved" value={String(summary.approvedCount)} />
                  <Stat label="Adherence" value={`${summary.adherenceRate}%`} />
                  <Stat label="Avg daily kcal" value={String(summary.avgDailyCalories)} />
                  <Stat
                    label="Protein (week)"
                    value={`${summary.totals.proteinG}g / ${summary.targets.proteinG * 7}g target`}
                  />
                </CardBody>
              </Card>
            ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'meals' ? (
          <Card>
            <CardHeader>
              <h3 className="font-bold">Meal history</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ash-grey-100 p-3">
                  <div>
                    <Link
                      to={
                        meal.status === 'in_review'
                          ? `/coach/queue/${meal.id}`
                          : `/coach/history/${meal.id}`
                      }
                      className="font-semibold text-blue-spruce-600 hover:underline">
                      {meal.mealName ?? 'Meal'}
                    </Link>
                    <p className="text-sm text-ash-grey-500">
                      {formatMealType(meal.mealType)} · {formatRelativeTime(meal.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={meal.status} />
                    {meal.totalNutrition ? (
                      <span className="text-sm text-ash-grey-600">{meal.totalNutrition.caloriesKcal} kcal</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>

      {tab === 'messages' && id ? <CoachMessagesPanel clientId={id} /> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ash-grey-50 p-4">
      <p className="text-xs text-ash-grey-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ash-grey-900">{value}</p>
    </div>
  );
}
