import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CoachOpinionModal,
  type OpinionDestination,
} from '@/components/coach/CoachOpinionModal';
import { SendBackReasonModal } from '@/components/coach/SendBackReasonModal';
import { Button } from '@/components/ui/Button';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { ZoomableImageModal } from '@/components/ui/ZoomableImageModal';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import {
  MealHealthInsight,
  MealNutrientDeepDive,
  MealNutritionHero,
  MealPlateComposition,
} from '@/components/meal/MealResultSections';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  aiAssistCoachMeal,
  createCoachReviewTask,
  fetchCoachMeal,
  fetchCoachReviewDraft,
  listCoachReviewTasks,
  pickCoachMeal,
  releaseCoachMeal,
  reviewCoachMeal,
  saveCoachReviewDraft,
} from '@/services/remote/coachApi';
import type { CoachMealDetail, ReviewDraft, ReviewTask, SaveReviewDraftPayload } from '@/types/coach';
import type { MacroTargets, NutritionFacts } from '@/types';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { buildPetals, sumItemNutrition } from '@/utils/mealNutrition';

export default function CoachMealReviewScreen() {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<CoachMealDetail | null>(null);
  const [draft, setDraft] = useState<ReviewDraft>(null);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);

  const [loading, setLoading] = useState(true);
  const [pickReleaseBusy, setPickReleaseBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  // Coach note to send to patient on reject (and optionally on approve).
  const [coachNote, setCoachNote] = useState('');
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Local full-screen image viewer (tap-to-open from hero).
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUri, setImageModalUri] = useState<string | null | undefined>(null);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [opinionOpen, setOpinionOpen] = useState(false);
  const [taskBusy, setTaskBusy] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSavePayloadRef = useRef<SaveReviewDraftPayload | null>(null);

  const clientName = detail?.client.profile?.displayName?.trim() || detail?.client.patientId || 'Patient';
  const meal = detail?.meal;

  const pickedByOther =
    Boolean(meal?.queueIsPicked) &&
    Boolean(meal?.queuePickedByCoachId) &&
    meal?.queuePickedByCoachId !== session?.user.id;

  const isPickedByMe =
    Boolean(meal?.queueIsPicked) &&
    Boolean(meal?.queuePickedByCoachId) &&
    meal?.queuePickedByCoachId === session?.user.id;

  const targets = useMemo<MacroTargets | null>(() => {
    const fromProfile = detail?.client.profile?.macroTargets;
    if (
      fromProfile &&
      Number.isFinite(fromProfile.calories) &&
      Number.isFinite(fromProfile.proteinG) &&
      Number.isFinite(fromProfile.carbsG) &&
      Number.isFinite(fromProfile.fatG)
    ) {
      return fromProfile as MacroTargets;
    }

    // Fallback if the coach client payload is missing macro targets.
    return { calories: 2000, proteinG: 55, carbsG: 250, fatG: 70, fiberG: 30 };
  }, [detail?.client.profile?.macroTargets]);

  const analysis = useMemo(() => {
    const itemsFromDraft = draft?.items?.length ? draft.items : [];
    const itemsFromMeal = meal?.items?.length ? meal.items : [];
    const items = itemsFromDraft.length ? itemsFromDraft : itemsFromMeal;

    const totalsFromMeal = meal?.totalNutrition;
    const totalsFromDraft = itemsFromDraft.length ? sumItemNutrition(itemsFromDraft) : null;

    const totals: NutritionFacts | null =
      (totalsFromDraft as unknown as NutritionFacts | null) ||
      (totalsFromMeal ? (totalsFromMeal as unknown as NutritionFacts) : null);

    const petals =
      (meal?.petals as unknown as Array<{ label: string; percent: number; color: string }> | undefined) ??
      (itemsFromDraft.length ? buildPetals(itemsFromDraft) : itemsFromMeal.length ? buildPetals(itemsFromMeal) : []);

    return { items, totals, petals };
  }, [draft?.items, meal?.items, meal?.totalNutrition, meal?.petals]);

  const clientMealTitle = useMemo(() => {
    const name = meal?.mealName?.trim();
    if (name) return name;
    const note = meal?.note?.trim();
    if (note) return note;
    const input = meal?.textInput?.trim();
    if (input) return input;
    return meal?.mealType ?? 'Meal';
  }, [meal?.mealName, meal?.note, meal?.textInput, meal?.mealType]);

  const openImage = useCallback((uri: string | null | undefined) => {
    setImageModalUri(uri);
    setImageModalOpen(true);
  }, []);

  const closeImage = useCallback(() => {
    setImageModalOpen(false);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setDraft(null);
    setTasks([]);
    try {
      const [mealRes, draftRes, tasksRes] = await Promise.all([
        fetchCoachMeal(id),
        fetchCoachReviewDraft(id),
        listCoachReviewTasks(id),
      ]);
      setDetail(mealRes);
      setDraft(draftRes);
      setTasks(tasksRes);

      const initialCoachNote = draftRes?.note ?? '';
      setCoachNote(initialCoachNote);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not open this meal.'));
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Persist coach note to review draft (debounced).
  useEffect(() => {
    if (!id) return;
    if (draftSaveState === 'saving') return;

    const trimmed = coachNote.trim();
    const nextPayload: SaveReviewDraftPayload = {
      note: trimmed.length ? trimmed : undefined,
      // Keep mealName synced with the most up-to-date source (AI draft if it exists, else server mealName).
      mealName: draft?.mealName ?? meal?.mealName ?? undefined,
    };

    // Avoid sending identical payloads.
    const prev = currentSavePayloadRef.current;
    const same =
      prev?.note === nextPayload.note &&
      (prev?.mealName ?? null) === (nextPayload.mealName ?? null);
    if (same) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      currentSavePayloadRef.current = nextPayload;
      void (async () => {
        try {
          setDraftSaveState('saving');
          await saveCoachReviewDraft(id, nextPayload);
          setDraftSaveState('saved');
          setTimeout(() => setDraftSaveState('idle'), 1200);
        } catch {
          setDraftSaveState('idle');
        }
      })();
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachNote, id]);

  const handlePick = async () => {
    if (!id || pickReleaseBusy || reviewBusy) return;
    setPickReleaseBusy(true);
    try {
      await pickCoachMeal(id);
      await load();
      toast.success('This review is now yours.', 'Picked up');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not pick this meal.'));
    } finally {
      setPickReleaseBusy(false);
    }
  };

  const handleRelease = async () => {
    if (!id || pickReleaseBusy || reviewBusy) return;
    setPickReleaseBusy(true);
    try {
      await releaseCoachMeal(id);
      await load();
      toast.success('Review released back to the queue.', 'Released');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not release this meal.'));
    } finally {
      setPickReleaseBusy(false);
    }
  };

  const handleAI = async () => {
    if (!id || aiBusy) return;
    setAiBusy(true);
    try {
      await aiAssistCoachMeal(id);
      await load();
      toast.success('AI draft generated. Review and approve when ready.', 'Draft updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not generate AI draft.'));
    } finally {
      setAiBusy(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject', rejectNote?: string) => {
    if (!id || reviewBusy || pickReleaseBusy) return;
    const trimmed = (rejectNote ?? coachNote).trim();
    if (action === 'reject' && trimmed.length < 3) {
      toast.error('Add a short note so the patient knows what to change.');
      return;
    }
    setReviewBusy(true);
    try {
      await reviewCoachMeal(id, {
        action,
        note: trimmed.length ? trimmed : undefined,
        mealName: draft?.mealName ?? meal?.mealName,
      });

      if (action === 'reject') {
        setSendBackOpen(false);
        setCoachNote(trimmed);
      }

      toast.success(
        action === 'approve'
          ? 'Meal approved. The patient will see it in their diary.'
          : 'Feedback sent to the patient.',
        action === 'approve' ? 'Approved' : 'Sent back',
      );
      router.back();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save this review.'));
    } finally {
      setReviewBusy(false);
    }
  };

  const handleOpinionSubmit = useCallback(
    async (payload: {
      destination: OpinionDestination;
      assigneeUserId?: string;
      note: string;
    }) => {
      if (!id) return;
      const type = payload.destination === 'admin' ? 'escalation' : 'second_opinion';
      const notifyChannel =
        payload.destination === 'team'
          ? 'team'
          : payload.destination === 'coach'
            ? 'assignee'
            : 'both';

      setTaskBusy(true);
      try {
        await createCoachReviewTask(id, {
          type,
          note: payload.note || undefined,
          notifyUser: payload.destination === 'admin',
          assigneeUserId: payload.assigneeUserId,
          notifyChannel,
        });
        await load();
        setOpinionOpen(false);
        toast.success(
          payload.destination === 'team'
            ? 'Posted to team chat.'
            : payload.destination === 'admin'
              ? 'Admin asked for a second look.'
              : 'Coach asked for a second opinion.',
          'Second opinion',
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not create review task.'));
      } finally {
        setTaskBusy(false);
      }
    },
    [id, load, toast],
  );

  const draftAnalysisExists = analysis.items.length > 0 || analysis.totals != null;

  const canInteract =
    Boolean(meal && (pickedByOther === false) && (isPickedByMe || !meal.queueIsPicked));

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title="Meal review" onBack={() => router.back()} />

        {loading || !meal ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-4 px-5 pt-4"
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
              <Pressable onPress={() => openImage(meal.imageUrl)}>
                <ResolvedImage
                  uri={meal.imageUrl}
                  className="h-56 w-full rounded-3xl"
                  resizeMode="cover"
                  fallback={
                    <View className="h-56 items-center justify-center rounded-3xl bg-ash-grey-100">
                      <Text className="text-5xl">🍽️</Text>
                    </View>
                  }
                />
              </Pressable>

              <View className="rounded-3xl bg-ash-grey-50 p-4">
                <Text className="text-xs font-sans-semibold uppercase tracking-wide text-blue-spruce-700">
                  {clientName}
                </Text>
                <Text className="mt-1 font-sans-bold text-xl text-neutral-900">{clientMealTitle}</Text>

                {meal.note || meal.textInput ? (
                  <Text className="mt-2 text-sm leading-5 text-neutral-600">{meal.note || meal.textInput}</Text>
                ) : null}

                {meal.queuePickedByCoachName ? (
                  <Text className="mt-2 text-xs text-neutral-500">Picked by {meal.queuePickedByCoachName}</Text>
                ) : null}
              </View>

              {pickedByOther ? (
                <View className="rounded-2xl bg-amber-50 px-4 py-3">
                  <Text className="text-sm text-amber-800">Another coach is already working on this review.</Text>
                </View>
              ) : null}

              <View className="gap-3">
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Draft & nutrition
                </Text>

                {draftAnalysisExists && targets ? (
                  <>
                    {analysis.totals ? (
                      <MealNutritionHero
                        totals={analysis.totals}
                        targets={targets}
                      />
                    ) : null}
                    <MealHealthInsight flag={meal.healthFlag} message={meal.healthMessage} />
                    <MealPlateComposition items={analysis.items} petals={analysis.petals as any} />
                    {analysis.items.length ? (
                      <MealNutrientDeepDive totals={analysis.totals as NutritionFacts} items={analysis.items} />
                    ) : null}
                  </>
                ) : (
                  <View className="rounded-3xl bg-ash-grey-50 px-4 py-4">
                    <Text className="text-sm font-sans-semibold text-neutral-900">No composition yet</Text>
                    <Text className="mt-1 text-sm leading-5 text-neutral-500">
                      Ask AI to generate a draft, or wait for the photo description to be confirmed.
                    </Text>
                  </View>
                )}
              </View>

              <View className="gap-2">
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Coach note
                </Text>

                <AppTextInput
                  value={coachNote}
                  onChangeText={setCoachNote}
                  placeholder="Coach note for the patient (optional on approve)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[96px] rounded-3xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
                  editable={canInteract && !pickedByOther}
                />

                {draftSaveState === 'saving' ? (
                  <Text className="text-xs text-neutral-500">Saving draft…</Text>
                ) : draftSaveState === 'saved' ? (
                  <Text className="text-xs text-shamrock-600">Draft saved</Text>
                ) : null}
              </View>

              <View className="gap-3">
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Actions
                </Text>

                {isPickedByMe && meal.queueIsPicked ? (
                  <View className="flex-row gap-3">
                    <Pressable
                      disabled={pickReleaseBusy || reviewBusy}
                      onPress={() => void handleRelease()}
                      className="h-12 flex-1 items-center justify-center rounded-2xl border border-ash-grey-200 bg-white active:opacity-80"
                      style={{ opacity: pickReleaseBusy || reviewBusy ? 0.5 : 1 }}>
                      <Text className="font-sans-semibold text-[14px] text-blue-spruce-800">
                        {pickReleaseBusy ? 'Releasing…' : 'Release'}
                      </Text>
                    </Pressable>
                    {canInteract ? (
                      <Pressable
                        disabled={aiBusy || reviewBusy || pickReleaseBusy}
                        onPress={() => void handleAI()}
                        className="h-12 flex-1 items-center justify-center rounded-2xl border border-blue-spruce-900 bg-white active:opacity-80"
                        style={{ opacity: aiBusy || reviewBusy || pickReleaseBusy ? 0.5 : 1 }}>
                        <Text className="font-sans-semibold text-[14px] text-blue-spruce-800">
                          {aiBusy ? 'Asking AI…' : 'Ask AI for draft'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {!meal.queueIsPicked ? (
                  <View className="flex-row gap-3">
                    <Pressable
                      disabled={pickReleaseBusy || reviewBusy}
                      onPress={() => void handlePick()}
                      className="h-12 flex-1 items-center justify-center rounded-2xl bg-neutral-950 active:opacity-90"
                      style={{ opacity: pickReleaseBusy || reviewBusy ? 0.5 : 1 }}>
                      <Text className="font-sans-bold text-[14px] text-white">
                        {pickReleaseBusy ? 'Picking up…' : 'Pick up review'}
                      </Text>
                    </Pressable>
                    {canInteract ? (
                      <Pressable
                        disabled={aiBusy || reviewBusy || pickReleaseBusy}
                        onPress={() => void handleAI()}
                        className="h-12 flex-1 items-center justify-center rounded-2xl border border-blue-spruce-900 bg-white active:opacity-80"
                        style={{ opacity: aiBusy || reviewBusy || pickReleaseBusy ? 0.5 : 1 }}>
                        <Text className="font-sans-semibold text-[14px] text-blue-spruce-800">
                          {aiBusy ? 'Asking AI…' : 'Ask AI for draft'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {!pickedByOther ? (
                  <Button
                    label={reviewBusy ? 'Saving…' : 'Approve meal'}
                    onPress={() => void handleReview('approve')}
                    disabled={reviewBusy || pickReleaseBusy}
                  />
                ) : null}

                {!pickedByOther ? (
                  <Pressable
                    disabled={reviewBusy || pickReleaseBusy}
                    onPress={() => setSendBackOpen(true)}
                    className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 py-3.5 active:opacity-80">
                    <Ionicons name="arrow-undo-outline" size={18} color="#b91c1c" />
                    <Text className="font-sans-semibold text-red-700">Send back</Text>
                  </Pressable>
                ) : null}
              </View>

              {tasks.length ? (
                <View className="gap-3">
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                    Review tasks
                  </Text>

                  {tasks.map((t) => (
                    <View key={t.id} className="rounded-3xl bg-ash-grey-50 px-4 py-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans-semibold text-neutral-900">
                          {t.type === 'second_opinion' ? 'Second opinion' : 'Escalation'}
                        </Text>
                        <Text className="text-xs text-neutral-500">{t.status}</Text>
                      </View>
                      {t.note ? (
                        <Text className="mt-1 text-sm leading-5 text-neutral-600">{t.note}</Text>
                      ) : null}
                      <Text className="mt-2 text-xs text-neutral-400">Created {new Date(t.createdAt).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {canInteract && !pickedByOther ? (
                <Pressable
                  disabled={reviewBusy || pickReleaseBusy || taskBusy}
                  onPress={() => setOpinionOpen(true)}
                  className="h-12 items-center justify-center rounded-2xl bg-neutral-950 active:opacity-90"
                  style={{ opacity: reviewBusy || pickReleaseBusy || taskBusy ? 0.5 : 1 }}>
                  <Text className="font-sans-bold text-[14px] text-white">Second opinion</Text>
                </Pressable>
              ) : null}

              {detail.recentMeals?.length ? (
                <View className="gap-3">
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                    Recent meals
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pb-1">
                    {detail.recentMeals.map((m, index) => (
                      <Pressable
                        key={m.id ?? `${index}`}
                        onPress={() => router.push(`/coach/meal/${m.id}` as any)}
                        className="w-[140px] overflow-hidden rounded-3xl bg-white">
                        <View className="h-28 w-full bg-ash-grey-50">
                          <ResolvedImage uri={m.thumbnailUrl ?? m.imageUrl} className="h-28 w-full" resizeMode="cover" />
                        </View>
                        <View className="px-3 py-3">
                          <Text className="text-sm font-sans-semibold text-neutral-900" numberOfLines={2}>
                            {m.mealName?.trim() || m.mealType || 'Meal'}
                          </Text>
                          <Text className="mt-1 text-[11px] text-neutral-500">
                            {m.submittedAt ? new Date(m.submittedAt).toLocaleDateString() : ''}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {detail.reviewHistory?.length ? (
                <View className="gap-3">
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                    Review history
                  </Text>
                  {detail.reviewHistory.slice(0, 3).map((entry, idx) => (
                    <View key={`${entry.reviewedAt ?? entry.coachId ?? idx}`} className="rounded-3xl bg-ash-grey-50 px-4 py-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-sans-semibold text-neutral-900">
                          {entry.action === 'approve' ? 'Approved' : entry.action === 'reject' ? 'Rejected' : 'Review'}
                        </Text>
                        <Text className="text-xs text-neutral-500">
                          {entry.reviewedAt ? new Date(entry.reviewedAt).toLocaleString() : ''}
                        </Text>
                      </View>
                      {entry.note ? <Text className="mt-1 text-sm leading-5 text-neutral-600">{entry.note}</Text> : null}
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Extra spacing so last buttons never hide behind tab bar / home indicator */}
              <View className="h-4" />
            </ScrollView>

            <ZoomableImageModal
              visible={imageModalOpen}
              uri={imageModalUri}
              onClose={closeImage}
            />

            <SendBackReasonModal
              visible={sendBackOpen}
              loading={reviewBusy}
              initialNote={coachNote}
              onClose={() => setSendBackOpen(false)}
              onSubmit={(note) => void handleReview('reject', note)}
            />

            <CoachOpinionModal
              visible={opinionOpen}
              loading={taskBusy}
              onClose={() => setOpinionOpen(false)}
              onSubmit={(payload) => void handleOpinionSubmit(payload)}
            />
          </>
        )}
      </View>
    </KeyboardSafeScreen>
  );
}
