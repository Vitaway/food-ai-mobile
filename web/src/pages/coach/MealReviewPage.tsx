import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CoachMessagesPanel } from '@/components/coach/CoachMessagesPanel';
import { ReviewTasksPanel } from '@/components/coach/ReviewTasksPanel';
import { MealReviewPanel } from '@/components/coach/MealReviewPanel';
import { ApproveMealModal } from '@/components/coach/ApproveMealModal';
import { SecondOpinionModal } from '@/components/coach/SecondOpinionModal';
import { FlagBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  coachKeys,
  useAssignClient,
  useCoachClient,
  useCoachMeal,
  useCoachQueue,
  useCreateReviewTask,
  usePickMeal,
  useReleaseMealPick,
  useReviewDraft,
  useReviewMeal,
  useSaveReviewDraft,
} from '@/hooks/useCoachQueries';
import { runCoachMealAiAssist } from '@/api/coachApi';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';

function sanitizeSeedItems(
  items: DetectedFoodItem[],
  opts?: { foodSource?: DetectedFoodItem['foodSource'] },
): DetectedFoodItem[] {
  return items.map((item) => ({
    ...item,
    label: isUsableMealName(item.label) ? item.label : 'Ingredient',
    foodSource: opts?.foodSource ?? item.foodSource ?? 'manual',
  }));
}

/** Old auto-seed / stub drafts — 1g rows with no Food DB link and not from Ask AI. */
function isPollutedAutoSeedDraft(items: DetectedFoodItem[] | undefined): boolean {
  if (!items?.length) return false;
  return items.every(
    (item) =>
      !item.nutritionFoodId &&
      item.foodSource !== 'ai' &&
      (item.estimatedWeightG ?? 0) <= 1 &&
      (item.foodSource === 'manual' || !item.foodSource),
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
  const pickMutation = usePickMeal();
  const releaseMutation = useReleaseMealPick();
  const toast = useToast();
  const queryClient = useQueryClient();
  const startReviewDraft = useCoachStore((s) => s.startReviewDraft);
  const hydrateReviewDraft = useCoachStore((s) => s.hydrateReviewDraft);
  const clearReviewDraft = useCoachStore((s) => s.clearReviewDraft);
  const reviewDraft = useCoachStore((s) => s.reviewDraft);
  const aiAssistMutation = useMutation({
    mutationFn: (mealId: string) => runCoachMealAiAssist(mealId),
    onSuccess: (result) => {
      const items = sanitizeSeedItems(result.draft.items, { foodSource: 'ai' });
      hydrateReviewDraft({
        mealId: result.draft.mealId,
        mealName: result.draft.mealName || result.mealName,
        items,
        note: result.draft.note ?? '',
        trainingNote: result.draft.trainingNote ?? '',
      });
      toast.success('AI suggestion added to your review. Check Food DB matches, then approve.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not run assist right now.'));
    },
  });
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [approveModal, setApproveModal] = useState<'single' | 'next' | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  /** Seed local editor once per meal — never reset from refetches / autosave. */
  const initializedMealIdRef = useRef<string | null>(null);
  const autoPickAttemptedRef = useRef<string | null>(null);

  const { data: coachProfile } = useCoachProfile();
  const { data: clientDetail } = useCoachClient(item?.client.patientId ?? null);

  useEffect(() => {
    if (!id || !item || item.meal.status !== 'in_review') return;
    if (autoPickAttemptedRef.current === id) return;
    const meal = item.meal;
    const isMine = coachProfile?.id && meal.queuePickedByCoachId === coachProfile.id;
    if (meal.queueIsPicked && isMine) return;
    if (meal.queuePickedByCoachId && meal.queuePickedByCoachId !== coachProfile?.id) return;
    autoPickAttemptedRef.current = id;
    void pickMutation.mutateAsync(id).catch(() => {
      autoPickAttemptedRef.current = null;
    });
  }, [id, item, coachProfile?.id, pickMutation]);

  // Clear editor when leaving this meal route
  useEffect(() => {
    return () => {
      initializedMealIdRef.current = null;
      autoPickAttemptedRef.current = null;
      clearReviewDraft();
    };
  }, [id, clearReviewDraft]);

  // One-time init: blank coach-first slate (wipe polluted auto-seeds). AI only after Ask AI.
  useEffect(() => {
    if (!id || !item?.meal || !draftFetched) return;
    if (initializedMealIdRef.current === id) return;
    initializedMealIdRef.current = id;

    const clientTitle = resolveCoachMealTitle({
      mealName:
        item.meal.note?.trim() ||
        item.meal.textInput?.trim() ||
        item.meal.mealName ||
        undefined,
      mealType: item.meal.mealType,
    });

    // Re-edit approved meals from the prior coach review.
    if (item.meal.coachReview?.items?.length) {
      const title = resolveCoachMealTitle({
        mealName: item.meal.coachReview.mealName || item.meal.mealName,
        mealType: item.meal.mealType,
      });
      startReviewDraft(
        item.meal.id,
        title,
        sanitizeSeedItems(item.meal.coachReview.items),
      );
      return;
    }

    const polluted =
      !persistedDraft ||
      persistedDraft.mealId !== id ||
      isPollutedAutoSeedDraft(persistedDraft.items);

    if (!polluted && persistedDraft?.mealId === id) {
      const title = isUsableMealName(persistedDraft.mealName)
        ? persistedDraft.mealName.trim()
        : clientTitle;
      hydrateReviewDraft({
        mealId: persistedDraft.mealId,
        mealName: title,
        items: sanitizeSeedItems(persistedDraft.items ?? []),
        note: persistedDraft.note ?? '',
        trainingNote: persistedDraft.trainingNote ?? '',
      });
      return;
    }

    // Blank slate — photo + client text only.
    startReviewDraft(item.meal.id, clientTitle, []);
    if (persistedDraft?.mealId === id) {
      saveDraft({
        mealId: id,
        mealName: clientTitle,
        items: [],
        note: '',
        trainingNote: '',
      });
      void queryClient.invalidateQueries({ queryKey: coachKeys.reviewDraft(id) });
    }
  }, [
    id,
    item?.meal,
    draftFetched,
    persistedDraft,
    hydrateReviewDraft,
    startReviewDraft,
    saveDraft,
    queryClient,
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

    if (action === 'approve') {
      setApproveModal(andNext ? 'next' : 'single');
      return;
    }

    const ok = await confirm({
      title: 'Reject this meal?',
      description:
        'The client will be asked to resubmit. Your training note (if any) is kept for model improvement.',
      confirmLabel: 'Reject meal',
      tone: 'danger',
    });
    if (!ok) return;
    await finalizeReview('reject', false);
  }

  async function finalizeReview(action: 'approve' | 'reject', andNext: boolean) {
    if (!item) return;
    const draft = useCoachStore.getState().reviewDraft;
    if (!draft || draft.mealId !== item.meal.id) return;

    try {
      await reviewMutation.mutateAsync({
        mealId: item.meal.id,
        action,
        note: draft.note || undefined,
        trainingNote: draft.trainingNote || undefined,
        mealName: draft.mealName,
        items: draft.items,
      });
      setApproveModal(null);
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

  async function handleSecondOpinion(payload: {
    destination: 'coach' | 'admin' | 'team';
    assigneeUserId?: string;
    note: string;
  }) {
    if (!item) return;
    const type = payload.destination === 'admin' ? 'escalation' : 'second_opinion';
    const notifyChannel =
      payload.destination === 'team' ? 'team' : payload.destination === 'coach' ? 'assignee' : 'both';

    try {
      await createTaskMutation.mutateAsync({
        mealId: item.meal.id,
        type,
        note: payload.note || undefined,
        notifyUser: payload.destination === 'admin',
        assigneeUserId: payload.assigneeUserId,
        notifyChannel,
      });
      const success =
        payload.destination === 'team'
          ? 'Posted to team chat.'
          : payload.destination === 'admin'
            ? 'Admin asked for a second look.'
            : 'Coach asked for a second opinion.';
      toast.success(success, 'Second opinion');
      setTaskModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not send second opinion request'));
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
  const isMyPick = Boolean(coachProfile?.id && meal.queuePickedByCoachId === coachProfile.id);
  const pickedByOther = Boolean(
    meal.queueIsPicked && meal.queuePickedByCoachId && !isMyPick,
  );
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
      {pickedByOther ? (
        <div className="rounded-xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-3 text-sm text-cinnamon-wood-900">
          <p className="font-semibold">Another coach is working on this review</p>
          <p className="mt-1">
            {meal.queuePickedByCoachName ?? 'A teammate'} picked this meal first. Release from their
            session or wait until they finish.
          </p>
        </div>
      ) : null}

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
          {isMyPick ? (
            <Button
              variant="outline"
              size="sm"
              disabled={releaseMutation.isPending}
              onClick={() =>
                void releaseMutation.mutateAsync(meal.id).then(() => {
                  toast.success('Review released.');
                  navigate('/coach/queue');
                })
              }>
              Release pick
            </Button>
          ) : null}
          {!isOnCaseload ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAssign()}
              disabled={assignMutation.isPending}>
              Add to caseload
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTaskModalOpen(true)}
            disabled={createTaskMutation.isPending}>
            Second opinion
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
        onAiAssist={() => {
          if (!id) return;
          if ((reviewDraft?.items.length ?? 0) > 0) {
            void confirm({
              title: 'Replace your draft?',
              description:
                'Ask AI suggestion will overwrite your current ingredient list with a new draft.',
              confirmLabel: 'Ask AI suggestion',
            }).then((ok) => {
              if (ok) aiAssistMutation.mutate(id);
            });
            return;
          }
          aiAssistMutation.mutate(id);
        }}
        isSubmitting={reviewMutation.isPending}
        isAiAssisting={aiAssistMutation.isPending}
        disabled={pickedByOther}
        isUpdate={Boolean(meal.coachReview)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewTasksPanel mealId={meal.id} />
        <CoachMessagesPanel clientId={mealItem.client.patientId} mealId={meal.id} />
      </div>

      <SecondOpinionModal
        open={taskModalOpen}
        loading={createTaskMutation.isPending}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={(payload) => void handleSecondOpinion(payload)}
      />

      {approveModal ? (
        <ApproveMealModal
          open
          andNext={approveModal === 'next'}
          loading={reviewMutation.isPending}
          onCancel={() => setApproveModal(null)}
          onConfirm={() => void finalizeReview('approve', approveModal === 'next')}
        />
      ) : null}

      {confirmDialog}
    </div>
  );
}
