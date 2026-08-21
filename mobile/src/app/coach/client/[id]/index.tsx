import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { ScreenTopBar } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import { useToast } from '@/context/ToastContext';
import { palette } from '@/design-system/colors';
import {
  createCoachInsight,
  fetchCoachClientDetail,
  fetchCoachClientWeeklySummary,
  fetchCoachClinicalAssessment,
  listCoachClientInsights,
} from '@/services/remote/coachApi';
import type {
  ClinicalAssessmentDto,
  CoachClientWeeklySummary,
  CoachInsight,
  CoachInsightType,
  CoachQueueClient,
  CoachQueueMeal,
} from '@/types/coach';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { formatRelativeTime } from '@/utils/time';

function statusTone(status?: string) {
  if (status === 'approved') return { bg: '#ecfdf3', text: '#166534', label: 'Approved' };
  if (status === 'rejected') return { bg: '#fef2f2', text: '#b91c1c', label: 'Sent back' };
  if (status === 'in_review') return { bg: '#fff7ed', text: '#c2410c', label: 'In review' };
  return { bg: '#f3f4f6', text: '#4b5563', label: status ?? 'Meal' };
}

function insightTypeLabel(type: CoachInsightType) {
  if (type === 'tip') return 'Tip';
  if (type === 'celebration') return 'Celebration';
  if (type === 'reminder') return 'Reminder';
  return type === 'trend' ? 'Trend' : 'Coach note';
}

function assessmentLabel(status?: ClinicalAssessmentDto['status']) {
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'draft') return 'Draft';
  return 'Incomplete';
}

export default function CoachClientScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<CoachQueueClient | null>(null);
  const [meals, setMeals] = useState<CoachQueueMeal[]>([]);
  const [summary, setSummary] = useState<CoachClientWeeklySummary | null>(null);
  const [assessment, setAssessment] = useState<ClinicalAssessmentDto | null>(null);
  const [insights, setInsights] = useState<CoachInsight[]>([]);

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

      setClient(detail.client);
      setMeals(detail.meals ?? []);
      setSummary(summaryRes);
      setAssessment(assessmentRes);
      setInsights(insightsRes);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load client.'));
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const clientName =
    client?.profile?.displayName?.trim() || client?.patientId || clientId || 'Client';
  const initial = clientName.slice(0, 1).toUpperCase();
  const avatarUrl = client?.profile?.avatarUrl;
  const allergies = client?.profile?.allergies ?? [];
  const targets = client?.profile?.macroTargets;

  const recentMeals = useMemo(
    () =>
      [...meals].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [meals],
  );

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title={clientName} onBack={() => router.back()} />

        {loading || !client ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette['blue-spruce'][700]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 px-5 py-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + FLOATING_TAB_BAR_CLEARANCE }}>
            {/* Profile hero */}
            <View className="items-center rounded-[28px] bg-ash-grey-50 px-5 py-6">
              <View className="h-24 w-24 overflow-hidden rounded-full border-[4px] border-white bg-white">
                <ResolvedImage
                  uri={avatarUrl}
                  className="h-full w-full"
                  resizeMode="cover"
                  fallback={
                    <View className="h-full w-full items-center justify-center bg-blue-spruce-600">
                      <Text className="font-sans-bold text-3xl text-white">{initial}</Text>
                    </View>
                  }
                />
              </View>
              <Text className="mt-4 font-sans-bold text-2xl text-blue-spruce-900">{clientName}</Text>
              <Text className="mt-1 text-sm text-ash-grey-500">
                {client.membershipTier === 'pro' ? 'Pro plan' : 'Standard plan'}
                {client.adherenceTrend ? ` · ${String(client.adherenceTrend).replace('_', ' ')}` : ''}
              </Text>

              {allergies.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap justify-center gap-1.5">
                  {allergies.map((allergy) => (
                    <View key={allergy} className="rounded-full bg-red-50 px-2.5 py-1">
                      <Text className="text-[11px] font-sans-semibold text-red-700">{allergy}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Quick stats */}
            {summary ? (
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-[22px] bg-ash-grey-50 px-3 py-3.5">
                  <Text className="text-[11px] text-ash-grey-500">Logged</Text>
                  <Text className="mt-1 font-sans-bold text-xl text-blue-spruce-900">
                    {summary.daysLogged}d
                  </Text>
                </View>
                <View className="flex-1 rounded-[22px] bg-ash-grey-50 px-3 py-3.5">
                  <Text className="text-[11px] text-ash-grey-500">Adherence</Text>
                  <Text className="mt-1 font-sans-bold text-xl text-blue-spruce-900">
                    {summary.adherenceRate}%
                  </Text>
                </View>
                <View className="flex-1 rounded-[22px] bg-ash-grey-50 px-3 py-3.5">
                  <Text className="text-[11px] text-ash-grey-500">Meals</Text>
                  <Text className="mt-1 font-sans-bold text-xl text-blue-spruce-900">
                    {summary.mealsSubmitted}
                  </Text>
                </View>
              </View>
            ) : null}

            {targets ? (
              <View className="rounded-[24px] bg-ash-grey-50 px-4 py-4">
                <Text className="text-[11px] font-sans-bold uppercase tracking-[0.08em] text-ash-grey-400">
                  Daily targets
                </Text>
                <Text className="mt-2 text-sm leading-5 text-blue-spruce-900">
                  {targets.calories} kcal · {targets.proteinG}g protein · {targets.carbsG}g carbs ·{' '}
                  {targets.fatG}g fat
                </Text>
              </View>
            ) : null}

            {/* Clinical assessment nav */}
            <Pressable
              onPress={() => router.push(`/coach/client/${clientId}/clinical` as Href)}
              className="flex-row items-center gap-3 rounded-[24px] border border-ash-grey-100 bg-white px-4 py-4 active:opacity-90">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-blue-spruce-50">
                <Ionicons name="clipboard-outline" size={20} color={palette['blue-spruce'][700]} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-[15px] text-blue-spruce-900">
                  Clinical assessment
                </Text>
                <Text className="mt-0.5 text-sm text-ash-grey-500">
                  {assessmentLabel(assessment?.status)} · open to review or update
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette['ash-grey'][400]} />
            </Pressable>

            {/* Logged meals */}
            <View>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-sans-bold text-base text-blue-spruce-900">Logged meals</Text>
                <Text className="text-sm text-ash-grey-500">{recentMeals.length}</Text>
              </View>

              {recentMeals.length === 0 ? (
                <View className="rounded-[24px] bg-ash-grey-50 px-4 py-8 items-center">
                  <Text className="font-sans-semibold text-blue-spruce-900">No meals yet</Text>
                  <Text className="mt-1 text-sm text-ash-grey-500">
                    Meals this patient logs will show up here.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {recentMeals.slice(0, 20).map((meal) => {
                    const tone = statusTone(meal.status);
                    const title =
                      meal.mealName?.trim() || meal.note?.trim() || meal.mealType || 'Meal';
                    return (
                      <Pressable
                        key={meal.id}
                        onPress={() => router.push(`/coach/meal/${meal.id}` as Href)}
                        className="flex-row gap-3 overflow-hidden rounded-[24px] bg-ash-grey-50 p-3 active:opacity-90">
                        <View className="h-[72px] w-[72px] overflow-hidden rounded-[18px] bg-white">
                          <ResolvedImage
                            uri={meal.thumbnailUrl ?? meal.imageUrl}
                            className="h-full w-full"
                            resizeMode="cover"
                            fallback={
                              <View className="h-full w-full items-center justify-center bg-blue-spruce-50">
                                <Ionicons
                                  name="restaurant"
                                  size={22}
                                  color={palette['blue-spruce'][400]}
                                />
                              </View>
                            }
                          />
                        </View>
                        <View className="min-w-0 flex-1 justify-center">
                          <Text
                            className="font-sans-bold text-[15px] text-blue-spruce-900"
                            numberOfLines={1}>
                            {title}
                          </Text>
                          <Text className="mt-0.5 text-sm text-ash-grey-500" numberOfLines={1}>
                            {meal.mealType}
                            {meal.totalNutrition?.caloriesKcal != null
                              ? ` · ${meal.totalNutrition.caloriesKcal} kcal`
                              : ''}
                            {' · '}
                            {formatRelativeTime(meal.submittedAt)}
                          </Text>
                          <View
                            className="mt-2 self-start rounded-full px-2.5 py-1"
                            style={{ backgroundColor: tone.bg }}>
                            <Text
                              className="text-[11px] font-sans-semibold"
                              style={{ color: tone.text }}>
                              {tone.label}
                            </Text>
                          </View>
                        </View>
                        <View className="items-center justify-center">
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={palette['ash-grey'][400]}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Insights */}
            <View className="gap-3">
              <Text className="font-sans-bold text-base text-blue-spruce-900">Coaching insights</Text>

              {insights.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-3">
                  {insights.slice(0, 10).map((ins, idx) => (
                    <View key={ins.id ?? idx} className="w-[280px] rounded-[24px] bg-ash-grey-50 p-4">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 font-sans-semibold text-sm text-blue-spruce-900">
                          {ins.title}
                        </Text>
                        <Text className="text-xs text-ash-grey-500">{insightTypeLabel(ins.type)}</Text>
                      </View>
                      <Text className="mt-2 text-sm leading-5 text-ash-grey-600">{ins.body}</Text>
                      <Text className="mt-2 text-xs text-ash-grey-400">
                        {new Date(ins.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View className="rounded-[24px] bg-ash-grey-50 px-4 py-5">
                  <Text className="font-sans-semibold text-blue-spruce-900">No insights yet</Text>
                  <Text className="mt-1 text-sm text-ash-grey-500">
                    Send the first note for this patient.
                  </Text>
                </View>
              )}

              <View className="rounded-[24px] border border-ash-grey-100 bg-white p-4">
                <Text className="font-sans-semibold text-blue-spruce-900">Create insight</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {(['coach_note', 'tip', 'celebration', 'reminder', 'trend'] as CoachInsightType[]).map(
                    (t) => {
                      const selected = insightType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => setInsightType(t)}
                          className={`rounded-full px-3 py-1.5 ${
                            selected ? 'bg-neutral-950' : 'bg-ash-grey-100'
                          }`}>
                          <Text
                            className={`text-xs font-sans-semibold ${
                              selected ? 'text-white' : 'text-ash-grey-600'
                            }`}>
                            {insightTypeLabel(t)}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
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
                    className="min-h-[110px] rounded-[20px] border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
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

            <View className="h-4" />
          </ScrollView>
        )}
      </View>
    </KeyboardSafeScreen>
  );
}
