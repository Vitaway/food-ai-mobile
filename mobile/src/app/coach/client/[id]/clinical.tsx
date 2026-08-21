import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { HealthGoalPicker } from '@/components/onboarding/HealthGoalPicker';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import { useToast } from '@/context/ToastContext';
import { palette } from '@/design-system/colors';
import {
  confirmCoachClinicalAssessment,
  fetchCoachClinicalAssessment,
  saveCoachClinicalAssessmentDraft,
} from '@/services/remote/coachApi';
import type {
  ClinicalAssessmentConfirmPayload,
  ClinicalAssessmentDto,
  ClinicalAssessmentSavePayload,
} from '@/types/coach';
import type { HealthGoal } from '@/types';
import { getApiErrorMessage } from '@/utils/apiErrors';

function StatusChip({ status }: { status: ClinicalAssessmentDto['status'] }) {
  const isConfirmed = status === 'confirmed';
  const bg = isConfirmed ? 'bg-shamrock-50' : status === 'draft' ? 'bg-ash-grey-50' : 'bg-red-50';
  const text = isConfirmed
    ? 'text-shamrock-800'
    : status === 'draft'
      ? 'text-neutral-700'
      : 'text-red-800';

  return (
    <View className={`rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-sans-semibold ${text}`}>
        {status === 'incomplete' ? 'Incomplete' : status}
      </Text>
    </View>
  );
}

export default function ClinicalAssessmentScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [assessment, setAssessment] = useState<ClinicalAssessmentDto | null>(null);
  const [goal, setGoal] = useState<HealthGoal | 'unknown'>('unknown');
  const [coachNotes, setCoachNotes] = useState('');
  const [confirmNote, setConfirmNote] = useState('');

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const assessmentRes = await fetchCoachClinicalAssessment(clientId);
      setAssessment(assessmentRes);
      setGoal((assessmentRes?.patientBasics?.goal as HealthGoal | undefined) ?? 'unknown');
      setCoachNotes(String(assessmentRes?.data?.coachNotes ?? ''));
      setConfirmNote('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load clinical assessment.'));
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveDraft = useCallback(async () => {
    if (!clientId || !assessment) return;
    const payload: ClinicalAssessmentSavePayload = {
      coachNotes: coachNotes.trim().length ? coachNotes.trim() : undefined,
      goal: goal === 'unknown' ? undefined : goal,
    };
    setBusy(true);
    try {
      await saveCoachClinicalAssessmentDraft(clientId, payload);
      toast.success('Clinical assessment draft saved.', 'Saved');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save draft.'));
    } finally {
      setBusy(false);
    }
  }, [clientId, assessment, coachNotes, goal, toast, load]);

  const handleConfirm = useCallback(async () => {
    if (!clientId) return;
    const payload: ClinicalAssessmentConfirmPayload = {
      allowProtectedWeightLoss: false,
      confirmationNote: confirmNote.trim().length ? confirmNote.trim() : undefined,
    };
    setBusy(true);
    try {
      await confirmCoachClinicalAssessment(clientId, payload);
      toast.success('Clinical assessment confirmed.', 'Confirmed');
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not confirm.'));
    } finally {
      setBusy(false);
    }
  }, [clientId, confirmNote, toast, load]);

  const basics = assessment?.patientBasics;

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title="Clinical assessment" onBack={() => router.back()} />

        {loading || !assessment ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette['blue-spruce'][700]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 px-5 py-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + FLOATING_TAB_BAR_CLEARANCE }}>
            <View className="flex-row items-center justify-between rounded-[24px] bg-ash-grey-50 px-4 py-4">
              <View>
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Status
                </Text>
                <Text className="mt-1 font-sans-semibold text-blue-spruce-900">
                  Patient clinical file
                </Text>
              </View>
              <StatusChip status={assessment.status} />
            </View>

            <View className="gap-3">
              <Text className="text-xs text-ash-grey-500">Select patient goal</Text>
              <HealthGoalPicker
                value={
                  (goal === 'unknown'
                    ? basics?.goal ?? 'improve_quality'
                    : goal) as HealthGoal
                }
                onChange={(g) => setGoal(g as HealthGoal)}
              />
            </View>

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
                className="min-h-[120px] rounded-[22px] border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
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
                className="min-h-[48px] rounded-[22px] border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  label={busy ? 'Saving…' : 'Save draft'}
                  variant="secondary"
                  onPress={() => void handleSaveDraft()}
                  disabled={busy}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  label={busy ? 'Saving…' : 'Confirm'}
                  onPress={() => void handleConfirm()}
                  disabled={busy}
                  fullWidth
                />
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardSafeScreen>
  );
}
