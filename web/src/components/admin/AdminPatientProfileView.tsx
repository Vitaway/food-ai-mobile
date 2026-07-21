import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { ClinicalAssessmentPanel } from '@/components/coach/ClinicalAssessmentPanel';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { KpiStrip } from '@/components/ui/KpiStrip';
import { FilterChip } from '@/components/ui/StatusPill';
import { StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField, FieldLabel } from '@/components/ui/Field';
import {
  useAdminPatientSummary,
  useAdminPatientView,
  useSetAdminClientCoaches,
  useUpdateAdminConsumerProfile,
} from '@/features/admin/hooks/useAdminQueries';
import { fetchAdminCoaches } from '@/features/admin/api/adminApi';
import { fetchAdminPatientCoachingInsights } from '@/features/admin/api/adminApi';
import { formatMealType, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import type { MealSubmission } from '@/types';
import {
  COMMON_ALLERGY_OPTIONS,
  GOAL_PACE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
} from '@/lib/clinicalAssessment';

const MEALS_PAGE_SIZE = 10;

type AdminPatientProfileViewProps = {
  userId: string;
  patientId: string;
};

function CoachingInsightsCard({ userId }: { userId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', userId, 'coaching-insights'],
    queryFn: () => fetchAdminPatientCoachingInsights(userId),
  });

  if (isLoading) return <p className="text-sm text-ash-grey-500">Loading coaching insights…</p>;
  if (!data.length) return null;

  return (
    <DashboardPanel title="Coaching insights">
      <div className="space-y-3 px-3 py-3">
        {data.map((item) => (
          <div key={item.id} className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
            <p className="font-semibold text-ash-grey-900">{item.title}</p>
            <p className="mt-1 text-sm text-ash-grey-600">{item.body}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function CoachAssignmentPanel({
  userId,
  assignedCoachIds,
}: {
  userId: string;
  assignedCoachIds: string[];
}) {
  const toast = useToast();
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['admin', 'coaches'],
    queryFn: fetchAdminCoaches,
  });
  const setCoaches = useSetAdminClientCoaches(userId);
  const [selected, setSelected] = useState<string[]>(assignedCoachIds);

  useEffect(() => {
    setSelected(assignedCoachIds);
  }, [assignedCoachIds]);

  const activeCoaches = coaches.filter(
    (coach) => coach.isActive && (coach.profile || coach.id),
  );

  async function save() {
    try {
      await setCoaches.mutateAsync(selected);
      toast.success('Assigned coaches updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update coach assignments'));
    }
  }

  function toggleCoach(coachId: string) {
    setSelected((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId],
    );
  }

  return (
    <DashboardPanel
      title="Assigned coaches"
      action={
        <Button size="sm" disabled={setCoaches.isPending} onClick={() => void save()}>
          Save coaches
        </Button>
      }>
      <div className="space-y-3 px-3 py-3 sm:px-4">
        <p className="text-sm text-ash-grey-600">
          Coaches assigned here receive this patient on their caseload and are notified for new
          reviews. New patients are auto-assigned to the coach with the lightest caseload.
        </p>
        {isLoading ? (
          <p className="text-sm text-ash-grey-500">Loading coaches…</p>
        ) : activeCoaches.length === 0 ? (
          <p className="text-sm text-ash-grey-500">No active coaches available.</p>
        ) : (
          <div className="space-y-2">
            {activeCoaches.map((coach) => (
              <label
                key={coach.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-ash-grey-100 px-3 py-2.5 hover:bg-ash-grey-50">
                <input
                  type="checkbox"
                  className="size-4 rounded border-ash-grey-300"
                  checked={selected.includes(coach.id)}
                  onChange={() => toggleCoach(coach.id)}
                />
                <div>
                  <p className="font-medium text-ash-grey-900">{coach.displayName}</p>
                  <p className="text-xs text-ash-grey-500">
                    {coach.profile?.title ?? 'Coach'}
                    {coach.profile?.organization ? ` · ${coach.profile.organization}` : ''}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}

export function AdminPatientProfileView({ userId, patientId }: AdminPatientProfileViewProps) {
  const toast = useToast();
  const { data, isLoading } = useAdminPatientView(userId);
  const { data: summary } = useAdminPatientSummary(userId);
  const updateConsumer = useUpdateAdminConsumerProfile();
  const [tab, setTab] = useState<'overview' | 'assessment' | 'meals' | 'notes' | 'basics'>(
    'overview',
  );
  const [mealSearch, setMealSearch] = useState('');
  const [mealStatus, setMealStatus] = useState('all');
  const [mealType, setMealType] = useState('all');
  const [mealPage, setMealPage] = useState(1);
  const [adminNotes, setAdminNotes] = useState('');
  const [basicsDraft, setBasicsDraft] = useState({
    displayName: '',
    goal: '',
    goalPace: '',
    allergies: [] as string[],
  });

  useEffect(() => {
    const notes = data?.client.profile.adminNotes;
    if (typeof notes === 'string') setAdminNotes(notes);
  }, [data?.client.profile.adminNotes]);

  useEffect(() => {
    const profile = data?.client.profile;
    if (!profile) return;
    setBasicsDraft({
      displayName: String(profile.displayName ?? ''),
      goal: String(profile.goal ?? ''),
      goalPace: String(profile.goalPace ?? ''),
      allergies: Array.isArray(profile.allergies)
        ? profile.allergies.map(String)
        : [],
    });
  }, [data?.client.profile]);

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
      filteredMeals.slice((mealPage - 1) * MEALS_PAGE_SIZE, mealPage * MEALS_PAGE_SIZE),
    [filteredMeals, mealPage],
  );

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredMeals.length / MEALS_PAGE_SIZE));
    if (mealPage > lastPage) setMealPage(lastPage);
  }, [filteredMeals.length, mealPage]);

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

  async function saveAdminNotes() {
    try {
      await updateConsumer.mutateAsync({
        userId,
        payload: { notes: adminNotes },
      });
      toast.success('Admin notes saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save admin notes'));
    }
  }

  async function saveBasics() {
    try {
      await updateConsumer.mutateAsync({
        userId,
        payload: {
          displayName: basicsDraft.displayName.trim() || undefined,
          goal: basicsDraft.goal || undefined,
          goalPace: basicsDraft.goalPace || undefined,
          allergies: basicsDraft.allergies,
        },
      });
      toast.success('Patient basics updated.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save patient basics'));
    }
  }

  function toggleAllergy(value: string) {
    setBasicsDraft((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(value)
        ? prev.allergies.filter((item) => item !== value)
        : [...prev.allergies, value],
    }));
  }

  if (isLoading) {
    return <p className="text-sm text-ash-grey-500">Loading patient profile…</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-600">Patient profile could not be loaded.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview' as const, label: 'Overview' },
            { id: 'basics' as const, label: 'Patient basics' },
            { id: 'assessment' as const, label: 'Clinical assessment' },
            { id: 'meals' as const, label: 'Meals' },
            { id: 'notes' as const, label: 'Admin notes' },
          ] as const
        ).map((item) => (
          <FilterChip
            key={item.id}
            label={item.label}
            active={tab === item.id}
            onClick={() => setTab(item.id)}
          />
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <ClientPanel client={data.client} showPreferences />
          <div className="space-y-5">
            <CoachAssignmentPanel
              userId={userId}
              assignedCoachIds={data.assignedCoachIds ?? []}
            />
            <CoachingInsightsCard userId={userId} />
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

      {tab === 'basics' ? (
        <DashboardPanel
          title="Patient-submitted details"
          action={
            <Button size="sm" disabled={updateConsumer.isPending} onClick={() => void saveBasics()}>
              Save patient basics
            </Button>
          }>
          <div className="space-y-4 px-3 py-3 sm:px-4">
            <TextField
              label="Patient display name"
              value={basicsDraft.displayName}
              onChange={(e) =>
                setBasicsDraft((prev) => ({ ...prev, displayName: e.target.value }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Goal</FieldLabel>
                <Select
                  aria-label="Goal"
                  value={basicsDraft.goal}
                  onChange={(next) => setBasicsDraft((prev) => ({ ...prev, goal: next }))}
                  options={[
                    { value: '', label: 'Select' },
                    ...HEALTH_GOAL_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    })),
                  ]}
                />
              </div>
              <div>
                <FieldLabel>Goal pace</FieldLabel>
                <Select
                  aria-label="Goal pace"
                  value={basicsDraft.goalPace}
                  onChange={(next) => setBasicsDraft((prev) => ({ ...prev, goalPace: next }))}
                  options={[
                    { value: '', label: 'Select' },
                    ...GOAL_PACE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    })),
                  ]}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Allergies</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_ALLERGY_OPTIONS.map((allergy) => {
                  const active = basicsDraft.allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-blue-spruce-600 bg-blue-spruce-600 text-white'
                          : 'border-ash-grey-200 bg-white text-ash-grey-700 hover:border-ash-grey-300'
                      }`}>
                      {allergy}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DashboardPanel>
      ) : null}

      {tab === 'assessment' ? (
        <ClinicalAssessmentPanel clientId={patientId} adminUserId={userId} />
      ) : null}

      {tab === 'meals' ? (
        <DashboardPanel title="Meal history">
          <div className="flex flex-wrap items-end gap-3 border-b border-ash-grey-100 px-3 py-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Search
              </span>
              <SearchInput
                value={mealSearch}
                onValueChange={(value) => {
                  setMealSearch(value);
                  setMealPage(1);
                }}
                placeholder="Search meal name or type"
                size="sm"
              />
            </label>
            <label className="min-w-[160px]">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Status
              </span>
              <Select
                aria-label="Filter meals by status"
                variant="filter"
                size="sm"
                value={mealStatus}
                onChange={(value) => {
                  setMealStatus(value);
                  setMealPage(1);
                }}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'analyzing', label: 'Analyzing' },
                  { value: 'in_review', label: 'In review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </label>
            <label className="min-w-[160px]">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
                Meal type
              </span>
              <Select
                aria-label="Filter meals by type"
                variant="filter"
                size="sm"
                value={mealType}
                onChange={(value) => {
                  setMealType(value);
                  setMealPage(1);
                }}
                options={[
                  { value: 'all', label: 'All meal types' },
                  ...mealTypes.map((type) => ({
                    value: type,
                    label: formatMealType(type),
                  })),
                ]}
              />
            </label>
          </div>
          <DataTable
            columns={mealColumns}
            rows={paginatedMeals}
            rowKey={(meal) => meal.id}
            emptyTitle={meals.length ? 'No meals match these filters' : 'No meals yet'}
          />
          <Pagination
            page={mealPage}
            pageSize={MEALS_PAGE_SIZE}
            total={filteredMeals.length}
            onPageChange={setMealPage}
          />
        </DashboardPanel>
      ) : null}

      {tab === 'notes' ? (
        <DashboardPanel
          title="Internal admin notes"
          action={
            <Button size="sm" disabled={updateConsumer.isPending} onClick={() => void saveAdminNotes()}>
              Save notes
            </Button>
          }>
          <div className="px-3 py-3">
            <TextAreaField
              label="Notes for coaches and admins"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              hint="Not visible to the patient in the app."
            />
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
