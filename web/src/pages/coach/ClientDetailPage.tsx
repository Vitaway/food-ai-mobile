import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { ClientCoachingInsightsPanel } from '@/components/coach/ClientCoachingInsightsPanel';
import { CoachMessagesPanel } from '@/components/coach/CoachMessagesPanel';
import { ClinicalAssessmentPanel } from '@/components/coach/ClinicalAssessmentPanel';
import { BanIcon, PlusIcon, PrintIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { FilterChip } from '@/components/ui/StatusPill';
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
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { MealSubmission } from '@/types';

const MEALS_PAGE_SIZE = 10;

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data, isLoading, isError } = useCoachClient(id ?? null);
  const { data: summary } = useCoachClientSummary(id ?? null);
  const assignMutation = useAssignClient();
  const unassignMutation = useUnassignClient();
  const { data: coachProfile } = useCoachProfile();
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'overview' | 'assessment' | 'meals' | 'messages'>('overview');
  const [mealSearch, setMealSearch] = useState('');
  const [mealStatus, setMealStatus] = useState('all');
  const [mealType, setMealType] = useState('all');
  const [mealPage, setMealPage] = useState(1);

  function handlePrint() {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<html><head><title>Client summary</title></head><body>${printRef.current.innerHTML}</body></html>`,
    );
    w.document.close();
    w.print();
  }

  async function handleAssign() {
    if (!id) return;
    const ok = await confirm({
      title: 'Add to your caseload?',
      description: 'This patient will appear on your Clients list.',
      confirmLabel: 'Add to caseload',
    });
    if (!ok) return;
    try {
      await assignMutation.mutateAsync(id);
      toast.success('Client added to your caseload.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not assign client'));
    }
  }

  async function handleUnassign() {
    if (!id) return;
    const ok = await confirm({
      title: 'Remove from your caseload?',
      description: 'You can add them again later from a meal review or this page.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await unassignMutation.mutateAsync(id);
      toast.success('Patient removed from your caseload.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update caseload'));
    }
  }

  const mealColumns: DataTableColumn<MealSubmission>[] = useMemo(
    () => [
      {
        key: 'meal',
        header: 'Meal',
        cell: (meal) => (
          <div>
            <p className="font-semibold text-ash-grey-900">{meal.mealName ?? 'Meal'}</p>
            <p className="text-xs text-ash-grey-500">{formatMealType(meal.mealType)}</p>
          </div>
        ),
      },
      {
        key: 'submitted',
        header: 'Submitted',
        cell: (meal) => (
          <span className="text-ash-grey-600">{formatRelativeTime(meal.submittedAt)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (meal) => <StatusBadge status={meal.status} />,
      },
      {
        key: 'kcal',
        header: 'Kcal',
        cell: (meal) =>
          meal.totalNutrition ? (
            <span className="text-ash-grey-700">{meal.totalNutrition.caloriesKcal}</span>
          ) : (
            <span className="text-ash-grey-400">—</span>
          ),
      },
    ],
    [],
  );

  const meals = data?.meals ?? [];
  const mealTypes = useMemo(
    () => [...new Set(meals.map((meal) => meal.mealType))].sort(),
    [meals],
  );
  const filteredMeals = useMemo(() => {
    const query = mealSearch.trim().toLowerCase();
    return [...meals]
      .filter((meal) => {
        if (mealStatus !== 'all' && meal.status !== mealStatus) return false;
        if (mealType !== 'all' && meal.mealType !== mealType) return false;
        if (!query) return true;
        return (
          (meal.mealName ?? '').toLowerCase().includes(query) ||
          formatMealType(meal.mealType).toLowerCase().includes(query)
        );
      })
      .sort(
        (left, right) =>
          new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
      );
  }, [meals, mealSearch, mealStatus, mealType]);
  const paginatedMeals = useMemo(
    () =>
      filteredMeals.slice(
        (mealPage - 1) * MEALS_PAGE_SIZE,
        mealPage * MEALS_PAGE_SIZE,
      ),
    [filteredMeals, mealPage],
  );

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredMeals.length / MEALS_PAGE_SIZE));
    if (mealPage > lastPage) setMealPage(lastPage);
  }, [filteredMeals.length, mealPage]);

  if (isLoading) return <p className="text-ash-grey-500">Loading client…</p>;

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold">Client not found</p>
        <Link to="/coach/clients" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const { client, assignedCoachIds } = data;
  const isOnCaseload = coachProfile?.id
    ? assignedCoachIds.includes(coachProfile.id)
    : assignedCoachIds.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/coach/clients" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Clients
        </Link>
        <h1 className="text-2xl tracking-tight text-ash-grey-900">
          {formatCoachPatientLabel(client.patientId, client.profile.displayName)}
        </h1>
        {isOnCaseload ? (
          <Button
            variant="outline"
            size="sm"
            icon={<BanIcon />}
            onClick={() => void handleUnassign()}
            disabled={unassignMutation.isPending}>
            Remove from caseload
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            icon={<PlusIcon />}
            onClick={() => void handleAssign()}
            disabled={assignMutation.isPending}>
            Add to caseload
          </Button>
        )}
        <Button variant="outline" size="sm" icon={<PrintIcon />} onClick={handlePrint}>
          Export PDF
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview' as const, label: 'Overview' },
            { id: 'assessment' as const, label: 'Clinical assessment' },
            { id: 'meals' as const, label: 'Meals' },
            { id: 'messages' as const, label: 'Messages' },
          ] as const
        ).map((t) => (
          <FilterChip
            key={t.id}
            label={t.label}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          />
        ))}
      </div>

      <div ref={printRef}>
        {tab === 'overview' ? (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <ClientPanel client={client} showPreferences />
            <div className="space-y-5">
              <ClientCoachingInsightsPanel clientId={client.patientId} />
              {summary ? (
                <DashboardPanel title={`Weekly summary · since ${summary.weekStart}`}>
                  <div className="px-3 py-3">
                    <KpiStrip
                      items={[
                        { label: 'Days logged', value: summary.daysLogged },
                        { label: 'Meals submitted', value: summary.mealsSubmitted },
                        { label: 'Approved', value: summary.approvedCount },
                        { label: 'Adherence', value: `${summary.adherenceRate}%` },
                        { label: 'Avg daily kcal', value: summary.avgDailyCalories },
                        {
                          label: 'Protein (week)',
                          value: `${summary.totals.proteinG}g`,
                          caption: `Target ${summary.targets.proteinG * 7}g`,
                        },
                      ]}
                    />
                  </div>
                </DashboardPanel>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'meals' ? (
          <DashboardPanel title="Meal history">
            <div className="flex flex-wrap items-end gap-3 border-b border-ash-grey-100 px-3 py-3">
              <label className="min-w-[220px] flex-1">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                  Search
                </span>
                <input
                  type="search"
                  value={mealSearch}
                  onChange={(event) => {
                    setMealSearch(event.target.value);
                    setMealPage(1);
                  }}
                  placeholder="Search meal name or type"
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
                />
              </label>
              <label className="min-w-[160px]">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                  Status
                </span>
                <select
                  value={mealStatus}
                  onChange={(event) => {
                    setMealStatus(event.target.value);
                    setMealPage(1);
                  }}
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="analyzing">Analyzing</option>
                  <option value="in_review">In review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className="min-w-[160px]">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                  Meal type
                </span>
                <select
                  value={mealType}
                  onChange={(event) => {
                    setMealType(event.target.value);
                    setMealPage(1);
                  }}
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100">
                  <option value="all">All meal types</option>
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatMealType(type)}
                    </option>
                  ))}
                </select>
              </label>
              {mealSearch || mealStatus !== 'all' || mealType !== 'all' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMealSearch('');
                    setMealStatus('all');
                    setMealType('all');
                    setMealPage(1);
                  }}>
                  Clear filters
                </Button>
              ) : null}
            </div>
            <DataTable
              columns={mealColumns}
              rows={paginatedMeals}
              rowKey={(m) => m.id}
              onRowClick={(meal) =>
                navigate(
                  meal.status === 'in_review'
                    ? `/coach/queue/${meal.id}`
                    : `/coach/history/${meal.id}`,
                )
              }
              emptyTitle={meals.length ? 'No meals match these filters' : 'No meals yet'}
              emptyDescription={
                meals.length
                  ? 'Try changing or clearing the meal filters.'
                  : 'Submitted meals for this patient will appear here.'
              }
            />
            <Pagination
              page={mealPage}
              pageSize={MEALS_PAGE_SIZE}
              total={filteredMeals.length}
              onPageChange={setMealPage}
            />
          </DashboardPanel>
        ) : null}

        {tab === 'assessment' && id ? <ClinicalAssessmentPanel clientId={id} /> : null}
      </div>

      {tab === 'messages' && id ? <CoachMessagesPanel clientId={id} /> : null}

      {confirmDialog}
    </div>
  );
}
