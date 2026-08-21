import { apiRequest } from '@/lib/apiClient';
import type {
  ClinicalAssessmentDto,
  ClinicalAssessmentConfirmPayload,
  ClinicalAssessmentSavePayload,
  CoachInsight,
  CoachMealDetail,
  CoachPasswordChangePayload,
  CoachProfile,
  CoachProfileUpdatePayload,
  CoachQueueClient,
  CoachQueueItem,
  CoachQueueMeal,
  CoachClientWeeklySummary,
  CoachInsightType,
  CoachStats,
  SmartCoachAlert,
  CreateReviewTaskPayload,
  ReviewDraft,
  SaveReviewDraftPayload,
  ReviewMealPayload,
  ReviewTask,
  CoachAIAssistMealResponse,
  CoachTeamResponse,
} from '@/types/coach';

type CoachProfileResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  profile: {
    title: string | null;
    organization: string | null;
    bio: string | null;
    phone: string | null;
    timezone: string | null;
  } | null;
};

type CoachClientResponse = {
  client: CoachQueueClient;
  meals: CoachQueueMeal[];
  assignedCoachIds: string[];
};

type ClinicalAssessmentResponse = ClinicalAssessmentDto;

export async function fetchCoachProfile(): Promise<CoachProfile> {
  const data = await apiRequest<CoachProfileResponse>('/coach/profile');
  return {
    id: data.user.id,
    displayName: data.user.displayName,
    email: data.user.email,
    jobTitle: data.profile?.title ?? 'Nutrition Coach',
    avatarUrl: data.user.avatarUrl ?? undefined,
    organization: data.profile?.organization,
    bio: data.profile?.bio ?? null,
    phone: data.profile?.phone ?? null,
    timezone: data.profile?.timezone ?? null,
  };
}

export async function fetchCoachQueue(): Promise<CoachQueueItem[]> {
  return apiRequest<CoachQueueItem[]>('/coach/queue');
}

export async function fetchCoachStats(): Promise<CoachStats> {
  return apiRequest<CoachStats>('/coach/stats');
}

export async function fetchCoachSmartAlerts(): Promise<SmartCoachAlert[]> {
  return apiRequest<SmartCoachAlert[]>('/coach/smart-alerts');
}

export async function fetchCoachClients(): Promise<CoachQueueClient[]> {
  return apiRequest<CoachQueueClient[]>('/coach/clients');
}

export async function fetchCoachMeal(id: string): Promise<CoachMealDetail | null> {
  return apiRequest<CoachMealDetail | null>(`/coach/meals/${id}`);
}

export async function pickCoachMeal(mealId: string) {
  return apiRequest(`/coach/meals/${mealId}/pick`, { method: 'POST' });
}

export async function releaseCoachMeal(mealId: string) {
  return apiRequest(`/coach/meals/${mealId}/pick`, { method: 'DELETE' });
}

export async function reviewCoachMeal(mealId: string, payload: ReviewMealPayload) {
  return apiRequest(`/coach/meals/${mealId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function aiAssistCoachMeal(mealId: string): Promise<CoachAIAssistMealResponse> {
  return apiRequest(`/coach/meals/${mealId}/ai-assist`, { method: 'POST' });
}

export async function fetchCoachClient(clientId: string): Promise<CoachClientResponse['client']> {
  const data = await apiRequest<CoachClientResponse>(`/coach/clients/${clientId}`);
  return data.client;
}

export async function fetchCoachClientDetail(clientId: string): Promise<CoachClientResponse> {
  return apiRequest<CoachClientResponse>(`/coach/clients/${clientId}`);
}

export async function fetchCoachClientWeeklySummary(
  clientId: string,
): Promise<CoachClientWeeklySummary> {
  return apiRequest<CoachClientWeeklySummary>(`/coach/clients/${clientId}/summary`);
}

export async function fetchCoachClinicalAssessment(
  clientId: string,
): Promise<ClinicalAssessmentResponse> {
  return apiRequest<ClinicalAssessmentResponse>(`/coach/clients/${clientId}/clinical-assessment`);
}

export async function saveCoachClinicalAssessmentDraft(
  clientId: string,
  payload: ClinicalAssessmentSavePayload,
): Promise<ClinicalAssessmentResponse> {
  return apiRequest<ClinicalAssessmentResponse>(`/coach/clients/${clientId}/clinical-assessment`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function confirmCoachClinicalAssessment(
  clientId: string,
  payload: ClinicalAssessmentConfirmPayload,
): Promise<ClinicalAssessmentResponse> {
  return apiRequest<ClinicalAssessmentResponse>(`/coach/clients/${clientId}/clinical-assessment/confirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type CoachCreateInsightPayload = {
  clientId: string;
  title: string;
  body: string;
  type?: CoachInsightType;
};

export async function listCoachInsights(): Promise<CoachInsight[]> {
  return apiRequest<CoachInsight[]>(`/coach/insights`);
}

export async function listCoachClientInsights(clientId: string): Promise<CoachInsight[]> {
  return apiRequest<CoachInsight[]>(`/coach/clients/${clientId}/insights`);
}

export async function createCoachInsight(payload: CoachCreateInsightPayload): Promise<CoachInsight> {
  return apiRequest<CoachInsight>(`/coach/insights`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCoachReviewDraft(mealId: string): Promise<ReviewDraft> {
  return apiRequest<ReviewDraft>(`/coach/meals/${mealId}/review-draft`);
}

export async function saveCoachReviewDraft(mealId: string, payload: SaveReviewDraftPayload) {
  return apiRequest(`/coach/meals/${mealId}/review-draft`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listCoachReviewTasks(mealId: string): Promise<ReviewTask[]> {
  return apiRequest<ReviewTask[]>(`/coach/meals/${mealId}/review-tasks`);
}

export async function createCoachReviewTask(mealId: string, payload: CreateReviewTaskPayload) {
  return apiRequest(`/coach/meals/${mealId}/review-tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCoachTeam(): Promise<CoachTeamResponse> {
  return apiRequest<CoachTeamResponse>('/coach/team');
}

export async function updateCoachProfile(payload: CoachProfileUpdatePayload): Promise<CoachProfile> {
  const data = await apiRequest<CoachProfileResponse>(`/coach/profile`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return {
    id: data.user.id,
    displayName: data.user.displayName,
    email: data.user.email,
    jobTitle: data.profile?.title ?? 'Nutrition Coach',
    avatarUrl: data.user.avatarUrl ?? undefined,
    organization: data.profile?.organization,
    bio: data.profile?.bio ?? null,
    phone: data.profile?.phone ?? null,
    timezone: data.profile?.timezone ?? null,
  };
}

export async function uploadCoachAvatar({
  uri,
  name,
  type,
}: {
  uri: string;
  name: string;
  type: string;
}): Promise<CoachProfile> {
  const form = new FormData();
  form.append('image', { uri, name, type } as unknown as Blob);

  const data = await apiRequest<CoachProfileResponse>(`/coach/profile/avatar`, {
    method: 'POST',
    body: form,
  });

  return {
    id: data.user.id,
    displayName: data.user.displayName,
    email: data.user.email,
    jobTitle: data.profile?.title ?? 'Nutrition Coach',
    avatarUrl: data.user.avatarUrl ?? undefined,
    organization: data.profile?.organization,
    bio: data.profile?.bio ?? null,
    phone: data.profile?.phone ?? null,
    timezone: data.profile?.timezone ?? null,
  };
}

export async function changeCoachPassword(payload: CoachPasswordChangePayload): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/coach/password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
