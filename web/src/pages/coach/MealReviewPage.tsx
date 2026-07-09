import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CoachMessagesPanel } from '@/components/coach/CoachMessagesPanel';
import { ClientPanel } from '@/components/coach/ClientPanel';
import { MealReviewPanel } from '@/components/coach/MealReviewPanel';
import { FlagBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useAssignClient,
  useCoachClient,
  useCoachMeal,
  useCoachQueue,
  useCreateReviewTask,
  useReviewDraft,
  useReviewMeal,
  useSaveReviewDraft,
} from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useCoachProfile } from '@/hooks/useCoachProfile';
import { formatMealType, formatRelativeTime } from '@/lib/utils';

export function MealReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = useCoachMeal(id ?? null);
  const { data: persistedDraft } = useReviewDraft(id ?? null);
  const cohortId = useCoachStore((s) => s.cohortId);
  const queueSearch = useCoachStore((s) => s.queueSearch);
  const queueSort = useCoachStore((s) => s.queueSort);
  const { data: queue } = useCoachQueue({
    cohortId: cohortId ?? undefined,
    search: queueSearch || undefined,
    sort: queueSort,
  });
  const reviewMutation = useReviewMeal();
  const saveDraftMutation = useSaveReviewDraft();
  const createTaskMutation = useCreateReviewTask();
  const assignMutation = useAssignClient();
  const toast = useToast();
  const startReviewDraft = useCoachStore((s) => s.startReviewDraft);
  const hydrateReviewDraft = useCoachStore((s) => s.hydrateReviewDraft);
  const clearReviewDraft = useCoachStore((s) => s.clearReviewDraft);
  const reviewDraft = useCoachStore((s) => s.reviewDraft);
  const [taskModal, setTaskModal] = useState<'second_opinion' | 'escalation' | null>(null);
  const [taskNote, setTaskNote] = useState('');

  const { data: coachProfile } = useCoachProfile();
  const { data: clientDetail } = useCoachClient(item?.client.patientId ?? null);

  useEffect(() => {
    if (!item?.meal) return;
    const seedItems = item.meal.aiAnalysis?.items ?? item.meal.items ?? [];
    startReviewDraft(item.meal.id, item.meal.aiAnalysis?.mealName ?? item.meal.mealName ?? '', seedItems);
    return () => clearReviewDraft();
  }, [item?.meal?.id, clearReviewDraft, startReviewDraft, item?.meal]);

  useEffect(() => {
    if (!persistedDraft || !item?.meal || persistedDraft.mealId !== item.meal.id) return;
    hydrateReviewDraft({
      mealId: persistedDraft.mealId,
      mealName: persistedDraft.mealName ?? item.meal.mealName ?? '',
      items: persistedDraft.items,
      note: persistedDraft.note ?? '',
      trainingNote: persistedDraft.trainingNote ?? '',
    });
  }, [persistedDraft, item?.meal, hydrateReviewDraft]);

  useEffect(() => {
    if (!reviewDraft || !id) return;
    const timer = window.setTimeout(() => {
      void saveDraftMutation.mutate({
        mealId: id,
        mealName: reviewDraft.mealName,
        items: reviewDraft.items,
        note: reviewDraft.note,
        trainingNote: reviewDraft.trainingNote,
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [id, reviewDraft, saveDraftMutation]);

  async function submitReview(action: 'approve' | 'reject', andNext = false) {
    if (!item || !reviewDraft) return;
    try {
      await reviewMutation.mutateAsync({
        mealId: item.meal.id,
        action,
        note: reviewDraft.note || undefined,
        trainingNote: reviewDraft.trainingNote || undefined,
        mealName: reviewDraft.mealName,
        items: reviewDraft.items,
      });
      toast.success(
        action === 'approve' ? 'Meal approved — coach review saved.' : 'Meal returned to the client.',
        action === 'approve' ? 'Approved' : 'Rejected',
      );

      if (andNext && action === 'approve' && queue?.length) {
        const remaining = queue.filter((q) => q.meal.id !== item.meal.id);
        if (remaining[0]) {
          navigate(`/coach/queue/${remaining[0].meal.id}`);
          return;
        }
      }
      navigate('/coach/queue');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not submit review'), 'Review failed');
    }
  }

  async function handleCreateTask() {
    if (!item || !taskModal) return;
    try {
      await createTaskMutation.mutateAsync({
        mealId: item.meal.id,
        type: taskModal,
        note: taskNote || undefined,
        notifyUser: taskModal === 'escalation',
      });
      toast.success(
        taskModal === 'second_opinion' ? 'Second opinion requested.' : 'Escalation logged.',
      );
      setTaskModal(null);
      setTaskNote('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create task'));
    }
  }

  if (isLoading) {
    return <p className="text-ash-grey-500">Loading meal…</p>;
  }

  if (isError || !item) {
    return (
      <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 text-center">
        <p className="font-semibold text-ash-grey-800">Meal not found</p>
        <Link to="/coach/queue" className="mt-3 inline-block text-blue-spruce-600 hover:underline">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const mealItem = item;

  async function handleAssign() {
    const patientId = mealItem.client.patientId;
    try {
      await assignMutation.mutateAsync(patientId);
      toast.success('Patient added to your caseload.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add to caseload'));
    }
  }

  const { meal, client } = mealItem;
  const allergies = client.profile.allergies ?? [];
  const isOnCaseload = Boolean(
    coachProfile?.id && clientDetail?.assignedCoachIds.includes(coachProfile.id),
  );
  const riskFlags = [
    meal.fraudCheckResult === 'flag' ? 'Fraud flag' : null,
    (meal.confidenceAvg ?? 1) < 0.8 ? 'Low AI confidence' : null,
    meal.slaLevel === 'critical' ? 'SLA critical' : null,
    allergies.length ? 'Client allergies on file' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {allergies.length ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Allergy alert</p>
          <p className="mt-1">Client reports: {allergies.join(', ')}. Verify ingredients carefully.</p>
        </div>
      ) : null}

      {riskFlags.length ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-cinnamon-wood-700">Risk</span>
          {riskFlags.map((flag) => (
            <span key={flag} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-cinnamon-wood-800">
              {flag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Queue
        </Link>
        {!isOnCaseload ? (
          <Button variant="secondary" size="sm" onClick={() => void handleAssign()} disabled={assignMutation.isPending}>
            Add to my caseload
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" onClick={() => setTaskModal('second_opinion')}>
          Request second opinion
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setTaskModal('escalation')}>
          Escalate
        </Button>
        <StatusBadge status={meal.status} />
        <FlagBadge flagged={meal.fraudCheckResult === 'flag'} />
        {meal.slaLevel === 'critical' ? (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            Waiting {meal.waitingMinutes}m
          </span>
        ) : meal.slaLevel === 'warning' ? (
          <span className="rounded-full bg-cinnamon-wood-100 px-2 py-1 text-xs font-semibold text-cinnamon-wood-700">
            {meal.slaMinutesRemaining != null
              ? `${meal.slaMinutesRemaining}m to SLA`
              : `Waiting ${meal.waitingMinutes}m`}
          </span>
        ) : null}
        <span className="text-sm text-ash-grey-500">
          {formatMealType(meal.mealType)} · {formatRelativeTime(meal.submittedAt)}
        </span>
        {saveDraftMutation.isPending ? (
          <span className="text-xs text-ash-grey-400">Saving draft…</span>
        ) : saveDraftMutation.isSuccess ? (
          <span className="text-xs text-shamrock-600">Draft saved</span>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <MealReviewPanel
          item={mealItem}
          onApprove={() => void submitReview('approve')}
          onApproveNext={() => void submitReview('approve', true)}
          onReject={() => void submitReview('reject')}
          isSubmitting={reviewMutation.isPending}
        />
        <div className="space-y-4">
          <ClientPanel client={mealItem.client} showPreferences />
          {mealItem.recentMeals?.length ? (
            <div className="rounded-3xl border border-ash-grey-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-bold text-ash-grey-800">Recent meals</h4>
              <ul className="space-y-2 text-sm">
                {mealItem.recentMeals.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <Link to={`/coach/queue/${m.id}`} className="text-blue-spruce-600 hover:underline">
                      {m.mealName ?? 'Meal'}
                    </Link>
                    <span className="text-ash-grey-500">{m.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <CoachMessagesPanel clientId={mealItem.client.patientId} mealId={meal.id} />
        </div>
      </div>

      {taskModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ash-grey-900">
              {taskModal === 'second_opinion' ? 'Request second opinion' : 'Escalate review'}
            </h3>
            <p className="mt-1 text-sm text-ash-grey-500">
              {taskModal === 'second_opinion'
                ? 'Flag this meal for another coach to review before you finalize.'
                : 'Log an escalation for admin or senior coach follow-up.'}
            </p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-2xl border border-ash-grey-200 px-4 py-3 text-sm outline-none focus:border-blue-spruce-400"
              placeholder="Optional note for the team…"
              value={taskNote}
              onChange={(e) => setTaskNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setTaskModal(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createTaskMutation.isPending}
                onClick={() => void handleCreateTask()}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
