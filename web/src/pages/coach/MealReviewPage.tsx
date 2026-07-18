import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CoachMessagesPanel } from '@/components/coach/CoachMessagesPanel';
import { ReviewTasksPanel } from '@/components/coach/ReviewTasksPanel';
import { MealReviewPanel } from '@/components/coach/MealReviewPanel';
import { FlagBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
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
import {
  formatMealType,
  formatRelativeTime,
  isUsableMealName,
  resolveCoachMealTitle,
} from '@/lib/utils';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { DetectedFoodItem } from '@/types';

function sanitizeSeedItems(items: DetectedFoodItem[]): DetectedFoodItem[] {
  return items.map((item) =>
    isUsableMealName(item.label) ? item : { ...item, label: 'Ingredient' },
  );
}

export function MealReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data: item, isLoading, isError } = useCoachMeal(id ?? null);
  const { data: persistedDraft, isFetched: draftFetched } = useReviewDraft(id ?? null);
  const cohortId = useCoachStore((s) => s.cohortId);
  const queueSearch = useCoachStore((s) => s.queueSearch);
  const queueSort = useCoachStore((s) => s.queueSort);
  const { data: queue } = useCoachQueue({
    cohortId: cohortId ?? undefined,
    search: queueSearch || undefined,
    sort: queueSort,
  });
  const reviewMutation = useReviewMeal();
  const { mutate: saveDraft } = useSaveReviewDraft();
  const createTaskMutation = useCreateReviewTask();
  const assignMutation = useAssignClient();
  const toast = useToast();
  const startReviewDraft = useCoachStore((s) => s.startReviewDraft);
  const hydrateReviewDraft = useCoachStore((s) => s.hydrateReviewDraft);
  const clearReviewDraft = useCoachStore((s) => s.clearReviewDraft);
  const reviewDraft = useCoachStore((s) => s.reviewDraft);
  const [taskModal, setTaskModal] = useState<'second_opinion' | 'escalation' | null>(null);
  const [taskNote, setTaskNote] = useState('');
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  /** Seed local editor once per meal — never reset from refetches / autosave. */
  const initializedMealIdRef = useRef<string | null>(null);

  const { data: coachProfile } = useCoachProfile();
  const { data: clientDetail } = useCoachClient(item?.client.patientId ?? null);

  // Clear editor when leaving this meal route
  useEffect(() => {
    return () => {
      initializedMealIdRef.current = null;
      clearReviewDraft();
    };
  }, [id, clearReviewDraft]);

  // One-time init: wait for server draft fetch, then hydrate or seed from AI
  useEffect(() => {
    if (!id || !item?.meal || !draftFetched) return;
    if (initializedMealIdRef.current === id) return;
    initializedMealIdRef.current = id;

    if (persistedDraft?.mealId === id) {
      const title = isUsableMealName(persistedDraft.mealName)
        ? persistedDraft.mealName.trim()
        : resolveCoachMealTitle({
            mealName: item.meal.mealName,
            aiMealName: item.meal.aiAnalysis?.mealName,
            mealType: item.meal.mealType,
          });
      hydrateReviewDraft({
        mealId: persistedDraft.mealId,
        mealName: title,
        items: sanitizeSeedItems(persistedDraft.items ?? []),
        note: persistedDraft.note ?? '',
        trainingNote: persistedDraft.trainingNote ?? '',
      });
      return;
    }

    const seedItems = sanitizeSeedItems(item.meal.aiAnalysis?.items ?? item.meal.items ?? []);
    const title = resolveCoachMealTitle({
      mealName: item.meal.mealName,
      aiMealName: item.meal.aiAnalysis?.mealName,
      mealType: item.meal.mealType,
    });
    startReviewDraft(item.meal.id, title, seedItems);
  }, [
    id,
    item?.meal,
    draftFetched,
    persistedDraft,
    hydrateReviewDraft,
    startReviewDraft,
  ]);

  // Debounced autosave — only when the local draft changes (not on mutation status)
  useEffect(() => {
    if (!reviewDraft || !id || reviewDraft.mealId !== id) return;
    if (initializedMealIdRef.current !== id) return;

    setDraftStatus('idle');
    const timer = window.setTimeout(() => {
      setDraftStatus('saving');
      saveDraft(
        {
          mealId: id,
          mealName: reviewDraft.mealName,
          items: reviewDraft.items,
          note: reviewDraft.note,
          trainingNote: reviewDraft.trainingNote,
        },
        {
          onSuccess: () => setDraftStatus('saved'),
          onError: () => setDraftStatus('idle'),
        },
      );
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [id, reviewDraft, saveDraft]);

  async function submitReview(action: 'approve' | 'reject', andNext = false) {
    if (!item || !reviewDraft) return;
    const ok = await confirm(
      action === 'approve'
        ? {
            title: andNext ? 'Approve and open next?' : 'Approve this meal?',
            description: andNext
              ? 'Your coach review will be saved and the client will see the approved nutrition. You’ll move to the next queue item.'
              : 'Your coach review will be saved and the client will see the approved nutrition.',
            confirmLabel: andNext ? 'Approve & next' : 'Approve meal',
            tone: 'primary',
          }
        : {
            title: 'Reject this meal?',
            description:
              'The client will be asked to resubmit. Your training note (if any) is kept for model improvement.',
            confirmLabel: 'Reject meal',
            tone: 'danger',
          },
    );
    if (!ok) return;

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
    const ok = await confirm({
      title: taskModal === 'second_opinion' ? 'Request second opinion?' : 'Escalate this review?',
      description:
        taskModal === 'second_opinion'
          ? 'Another coach will see this request and it will post to the team chat when possible.'
          : 'This escalation will be logged for follow-up and posted to the team chat when possible.',
      confirmLabel: 'Submit request',
      tone: 'primary',
    });
    if (!ok) return;
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
      <div className="rounded-2xl border border-ash-grey-200 bg-white p-8 text-center">
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
    const ok = await confirm({
      title: 'Add to your caseload?',
      description: 'You’ll see this patient on your Clients list and can message them from coaching tools.',
      confirmLabel: 'Add to caseload',
    });
    if (!ok) return;
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
  ].filter(Boolean) as string[];

  const pageTitle = resolveCoachMealTitle({
    mealName: reviewDraft?.mealName || meal.mealName,
    aiMealName: meal.aiAnalysis?.mealName,
    mealType: meal.mealType,
  });

  return (
    <div className="space-y-4">
      {allergies.length ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Allergy alert</p>
          <p className="mt-1">Client reports: {allergies.join(', ')}. Verify ingredients carefully.</p>
        </div>
      ) : null}

      {riskFlags.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cinnamon-wood-700">
            Risk
          </span>
          {riskFlags.map((flag) => (
            <StatusPill key={flag} tone="warn">
              {flag}
            </StatusPill>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/coach/queue" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          ← Queue
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-ash-grey-900">{pageTitle}</h1>
        <span className="text-sm text-ash-grey-500">
          {formatMealType(meal.mealType)} · {formatRelativeTime(meal.submittedAt)}
        </span>
        <StatusBadge status={meal.status} />
        <FlagBadge flagged={meal.fraudCheckResult === 'flag'} />
        {meal.slaLevel === 'critical' ? (
          <StatusPill tone="bad">Waiting {meal.waitingMinutes}m</StatusPill>
        ) : meal.slaLevel === 'warning' ? (
          <StatusPill tone="warn">
            {meal.slaMinutesRemaining != null
              ? `${meal.slaMinutesRemaining}m to SLA`
              : `Waiting ${meal.waitingMinutes}m`}
          </StatusPill>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!isOnCaseload ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAssign()}
              disabled={assignMutation.isPending}>
              Add to caseload
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setTaskModal('second_opinion')}>
            Second opinion
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTaskModal('escalation')}>
            Escalate
          </Button>
          {draftStatus === 'saving' ? (
            <span className="text-xs text-ash-grey-400">Saving…</span>
          ) : draftStatus === 'saved' ? (
            <span className="text-xs text-shamrock-600">Draft saved</span>
          ) : null}
        </div>
      </div>

      <MealReviewPanel
        item={mealItem}
        onApprove={() => void submitReview('approve')}
        onApproveNext={() => void submitReview('approve', true)}
        onReject={() => void submitReview('reject')}
        isSubmitting={reviewMutation.isPending}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewTasksPanel mealId={meal.id} />
        <CoachMessagesPanel clientId={mealItem.client.patientId} mealId={meal.id} />
      </div>

      {taskModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-ash-grey-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ash-grey-900">
              {taskModal === 'second_opinion' ? 'Request second opinion' : 'Escalate review'}
            </h3>
            <p className="mt-1 text-sm text-ash-grey-500">
              {taskModal === 'second_opinion'
                ? 'Flag this meal for another coach. Your note appears here and in the team chat.'
                : 'Log an escalation for admin or senior coach follow-up. Posted to the team chat when possible.'}
            </p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400"
              placeholder="Optional note for the team…"
              value={taskNote}
              onChange={(e) => setTaskNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setTaskModal(null)}>
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

      {confirmDialog}
    </div>
  );
}
