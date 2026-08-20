import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { Button } from '@/components/ui/Button';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { FieldInput } from '@/components/ui/FieldInput';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { HealthGoalPicker } from '@/components/onboarding/HealthGoalPicker';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import { useToast } from '@/context/ToastContext';
import type {
  ClinicalAssessmentDto,
  CoachInsight,
  ClinicalAssessmentConfirmPayload,
  ClinicalAssessmentSavePayload,
  CoachClientWeeklySummary,
  CoachInsightType,
} from '@/types/coach';
import {
  confirmCoachClinicalAssessment,
  createCoachInsight,
  fetchCoachClientDetail,
  fetchCoachClinicalAssessment,
  fetchCoachClientWeeklySummary,
  listCoachClientInsights,
  saveCoachClinicalAssessmentDraft,
} from '@/services/remote/coachApi';
import type { HealthGoal } from '@/types';
import { getApiErrorMessage } from '@/utils/apiErrors';

function StatusChip({ status }: { status: ClinicalAssessmentDto['status'] }) {
  const isConfirmed = status === 'confirmed';
  const bg = isConfirmed ? 'bg-shamrock-50' : status === 'draft' ? 'bg-ash-grey-50' : 'bg-red-50';
  const text = isConfirmed ? 'text-shamrock-800' : status === 'draft' ? 'text-neutral-700' : 'text-red-800';

  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-sans-semibold ${text}`}>{status === 'incomplete' ? 'Incomplete' : status}</Text>
    </View>
  );
}

function insightTypeLabel(type: CoachInsightType) {
  if (type === 'tip') return 'Tip';
  if (type === 'celebration') return 'Celebration';
  if (type === 'reminder') return 'Reminder';
  return type === 'trend' ? 'Trend' : 'Coach note';
}

export default function CoachClientScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState<string>('Client');
  const [summary, setSummary] = useState<CoachClientWeeklySummary | null>(null);
  const [assessment, setAssessment] = useState<ClinicalAssessmentDto | null>(null);
  const [insights, setInsights] = useState<CoachInsight[]>([]);

  // Clinical assessment editor (minimal fields for now: goal + coach notes).
  const basics = assessment?.patientBasics;
  const [goal, setGoal] = useState<HealthGoal | 'unknown'>('unknown');
  const [coachNotes, setCoachNotes] = useState('');
  const [confirmNote, setConfirmNote] = useState('');

  // Insights composer.
  const [insightType, setInsightType] = useState<CoachInsightType>('coach_note');
  const [insightTitle, setInsightTitle] = useState('');
  const [insightBody, setInsightBody] = useState('');
  const [composerBusy, setComposerBusy] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [detail, summaryRes, assessmentRes, insightsRes] = await Promise.all([
        fetchCoachClientDetail(clientId),
        fetchCoachClientWeeklySummary(clientId),
        fetchCoachClinicalAssessment(clientId),
        listCoachClientInsights(clientId),
      ]);

      setClientName(
        detail?.client?.profile?.displayName?.trim() ??
          detail?.client?.patientId ??
          clientId,
      );
      setSummary(summaryRes);
      setAssessment(assessmentRes);
      setInsights(insightsRes);

      setGoal((assessmentRes?.patientBasics?.goal as HealthGoal | undefined) ?? 'unknown');
      setCoachNotes(String(assessmentRes?.data?.coachNotes ?? ''));
      setConfirmNote('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load client.'));
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveAssessmentDraft = useCallback(async () => {
    if (!clientId || !assessment) return;
    const payload: ClinicalAssessmentSavePayload = {
      coachNotes: coachNotes.trim().length ? coachNotes.trim() : undefined,
      goal: goal === 'unknown' ? undefined : goal,
    };
    try {
      await saveCoachClinicalAssessmentDraft(clientId, payload);
      toast.success('Clinical assessment draft saved.', 'Saved');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save draft.'));
    }
  }, [clientId, assessment, coachNotes, goal, toast, load]);

  const handleConfirmAssessment = useCallback(async () => {
    if (!clientId) return;
    const payload: ClinicalAssessmentConfirmPayload = {
      allowProtectedWeightLoss: false,
      confirmationNote: confirmNote.trim().length ? confirmNote.trim() : undefined,
    };
    try {
      await confirmCoachClinicalAssessment(clientId, payload);
      toast.success('Clinical assessment confirmed.', 'Confirmed');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not confirm.'));
    }
  }, [clientId, confirmNote, toast, load]);

  const handleCreateInsight = useCallback(async () => {
    if (!clientId) return;
    const title = insightTitle.trim();
    const body = insightBody.trim();
    if (title.length < 2 || body.length < 3) {
      toast.error('Add a title (2+ chars) and a message (3+ chars).');
      return;
    }

    setComposerBusy(true);
    try {
      await createCoachInsight({
        clientId,
        title,
        body,
        type: insightType,
      });
      setInsightTitle('');
      setInsightBody('');
      toast.success('Insight added.', 'Sent');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create insight.'));
    } finally {
      setComposerBusy(false);
    }
  }, [clientId, insightType, insightTitle, insightBody, toast, load]);

  const summaryTotals = useMemo(() => summary?.totals, [summary]);

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title="Client workspace" onBack={() => router.back()} />

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 px-5 py-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + FLOATING_TAB_BAR_CLEARANCE }}>
            <View className="rounded-3xl bg-ash-grey-50 p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-xs font-sans-semibold uppercase tracking-wide text-blue-spruce-700">
                    {clientId}
                  </Text>
                  <Text className="mt-1 font-sans-bold text-2xl text-neutral-900">{clientName}</Text>
                </View>
                <View className="mt-1">
                  {assessment ? <StatusChip status={assessment.status} /> : null}
                </View>
              </View>
            </View>

            {summary ? (
              <View className="rounded-3xl bg-white p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                    Weekly summary
                  </Text>
                  <Text className="text-xs text-neutral-500">{summary.weekStart}</Text>
                </View>
                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-ash-grey-50 p-3">
                    <Text className="text-xs text-neutral-500">Logged</Text>
                    <Text className="mt-1 text-lg font-sans-bold text-neutral-900">{summary.daysLogged} days</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-ash-grey-50 p-3">
                    <Text className="text-xs text-neutral-500">Adherence</Text>
                    <Text className="mt-1 text-lg font-sans-bold text-neutral-900">{summary.adherenceRate}%</Text>
                  </View>
                </View>

                <View className="mt-3 rounded-2xl bg-ash-grey-50 p-3">
                  <Text className="text-xs text-neutral-500">Macros (approved)</Text>
                  <Text className="mt-1 text-sm text-neutral-800">
                    {summaryTotals?.proteinG ?? 0}g protein · {summaryTotals?.carbsG ?? 0}g carbs · {summaryTotals?.fatG ?? 0}g fat
                  </Text>
                </View>
              </View>
            ) : null}

            {assessment ? (
              <View className="rounded-3xl bg-white p-4">
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Clinical assessment
                </Text>

                <View className="mt-3 gap-3">
                  <Text className="text-xs text-neutral-500">Select patient goal</Text>
                  <HealthGoalPicker
                    value={(goal === 'unknown' ? basics?.goal ?? 'improve_quality' : goal) as any}
                    onChange={(g) => setGoal(g as HealthGoal)}
                  />

                  <View className="gap-2">
                    <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                      Coach notes
                    </Text>
                    <AppTextInput
                      value={coachNotes}
                      onChangeText={setCoachNotes}
                      placeholder="Add anything the team should know…"
                      multiline
                      textAlignVertical="top"
                      className="min-h-[96px] rounded-3xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
                    />
                  </View>

                  <View className="gap-2">
                    <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                      Confirmation note (optional)
                    </Text>
                    <AppTextInput
                      value={confirmNote}
                      onChangeText={setConfirmNote}
                      placeholder="Explain what you’re confirming (optional)"
                      multiline={false}
                      className="min-h-[48px] rounded-3xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Button
                        label="Save draft"
                        variant="secondary"
                        onPress={() => void handleSaveAssessmentDraft()}
                        disabled={composerBusy}
                        fullWidth
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        label="Confirm"
                        onPress={() => void handleConfirmAssessment()}
                        disabled={composerBusy}
                        fullWidth
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View className="rounded-3xl bg-white p-4">
              <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                Coaching insights
              </Text>

              <View className="mt-3 gap-3">
                {insights.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                    {insights.slice(0, 10).map((ins, idx) => (
                      <View key={ins.id ?? idx} className="w-[280px] rounded-3xl bg-ash-grey-50 p-4">
                        <View className="flex-row items-start justify-between">
                          <Text className="font-sans-semibold text-sm text-neutral-900">{ins.title}</Text>
                          <Text className="text-xs text-neutral-500">{insightTypeLabel(ins.type)}</Text>
                        </View>
                        <Text className="mt-2 text-sm leading-5 text-neutral-700">{ins.body}</Text>
                        <Text className="mt-2 text-xs text-neutral-400">
                          {new Date(ins.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View className="rounded-3xl bg-ash-grey-50 px-4 py-5">
                    <Text className="font-sans-semibold text-base text-neutral-900">No insights yet</Text>
                    <Text className="mt-1 text-sm leading-5 text-neutral-500">
                      Create the first message for this patient.
                    </Text>
                  </View>
                )}

                <View className="rounded-3xl border border-ash-grey-100 bg-ash-grey-50 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="font-sans-semibold text-neutral-900">Create insight</Text>
                    <Ionicons name="sparkles-outline" size={18} color="#848a75" />
                  </View>

                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {(['coach_note', 'tip', 'celebration', 'reminder', 'trend'] as CoachInsightType[]).map((t) => {
                      const selected = insightType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setInsightType(t)}
                          className={`rounded-full px-3 py-1 ${
                            selected ? 'bg-blue-spruce-50' : 'bg-white'
                          }`}>
                          <Text className={`text-xs ${selected ? 'text-blue-spruce-800' : 'text-neutral-600'}`}>
                            {insightTypeLabel(t)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="mt-3 gap-3">
                    <FieldInput
                      label="Title"
                      value={insightTitle}
                      onChangeText={setInsightTitle}
                      placeholder="Short headline"
                    />

                    <AppTextInput
                      value={insightBody}
                      onChangeText={setInsightBody}
                      placeholder="Write the message…"
                      multiline
                      textAlignVertical="top"
                      className="min-h-[110px] rounded-3xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
                    />

                    <Button
                      label={composerBusy ? 'Sending…' : 'Send insight'}
                      onPress={() => void handleCreateInsight()}
                      disabled={composerBusy}
                      fullWidth
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </KeyboardSafeScreen>
  );
}

