import { apiRequest } from '@/lib/apiClient';
import type { CoachAnalytics } from '@/components/coach/DashboardCharts';
import type {
  CoachClient,
  CoachClientDetail,
  CoachCohort,
  CoachDashboardStats,
  CoachMealDetail,
  CoachMessage,
  CoachPastReviewItem,
  CoachProfile,
  CoachQueueItem,
  CoachTeamMember,
  CoachWeeklySummary,
  MealSubmission,
  ReviewMealPayload,
  UpdateCoachPasswordPayload,
  UpdateCoachProfilePayload,
} from '@/types';

type CoachProfileResponse = {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    memberSince: string;
  };
  profile: {
    id: string;
    title: string | null;
    organization: string | null;
    bio: string | null;
    phone: string | null;
    timezone: string | null;
  } | null;
};

function mapCoachProfile(data: CoachProfileResponse): CoachProfile {
  return {
    id: data.user.id,
    displayName: data.user.displayName,
    email: data.user.email,
    phone: data.profile?.phone ?? undefined,
    jobTitle: data.profile?.title ?? 'Nutrition Coach',
    bio: data.profile?.bio ?? undefined,
    timezone: data.profile?.timezone ?? 'Africa/Kigali',
    avatarUrl: data.user.avatarUrl ?? undefined,
    memberSince: data.user.memberSince,
  };
}

function cohortQuery(cohortId?: string) {
  return cohortId ? `?cohortId=${encodeURIComponent(cohortId)}` : '';
}

export async function fetchCoachProfile(): Promise<CoachProfile> {
  const data = await apiRequest<CoachProfileResponse>('/coach/profile');
  return mapCoachProfile(data);
}

export async function updateCoachProfile(
  payload: UpdateCoachProfilePayload,
): Promise<CoachProfile> {
  const body: Record<string, string | null | undefined> = {
    displayName: payload.displayName,
    title: payload.jobTitle,
    bio: payload.bio,
    phone: payload.phone,
    timezone: payload.timezone,
  };
  if (payload.avatarUrl !== undefined) {
    body.avatarUrl = payload.avatarUrl ?? null;
  }

  const data = await apiRequest<CoachProfileResponse>('/coach/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return mapCoachProfile(data);
}

export async function uploadCoachAvatar(file: File): Promise<CoachProfile> {
  const formData = new FormData();
  formData.append('image', file);
  const data = await apiRequest<CoachProfileResponse>('/coach/profile/avatar', {
    method: 'POST',
    body: formData,
  });
  return mapCoachProfile(data);
}

export async function updateCoachPassword(payload: UpdateCoachPasswordPayload): Promise<void> {
  await apiRequest('/coach/password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCoachStats(cohortId?: string): Promise<CoachDashboardStats> {
  return apiRequest<CoachDashboardStats>(`/coach/stats${cohortQuery(cohortId)}`);
}

export async function fetchCoachAnalytics(cohortId?: string): Promise<CoachAnalytics> {
  return apiRequest<CoachAnalytics>(`/coach/analytics${cohortQuery(cohortId)}`);
}

export type QueueQuery = {
  search?: string;
  sort?: 'oldest' | 'newest' | 'flagged' | 'low_confidence' | 'sla_urgency';
  cohortId?: string;
};

function queueQuery(params: QueueQuery = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.sort) q.set('sort', params.sort);
  if (params.cohortId) q.set('cohortId', params.cohortId);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function fetchPastReviews(params?: {
  search?: string;
  action?: 'approve' | 'reject';
  limit?: number;
}): Promise<CoachPastReviewItem[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.action) q.set('action', params.action);
  if (params?.limit) q.set('limit', String(params.limit));
  const s = q.toString();
  return apiRequest<CoachPastReviewItem[]>(`/coach/reviews${s ? `?${s}` : ''}`);
}

export async function fetchCoachQueue(params?: QueueQuery): Promise<CoachQueueItem[]> {
  return apiRequest<CoachQueueItem[]>(`/coach/queue${queueQuery(params)}`);
}

export async function fetchMealById(id: string): Promise<CoachMealDetail | null> {
  return apiRequest<CoachMealDetail | null>(`/coach/meals/${id}`);
}

export async function fetchClients(cohortId?: string): Promise<CoachClient[]> {
  return apiRequest<CoachClient[]>(`/coach/clients${cohortQuery(cohortId)}`);
}

export async function fetchClientById(id: string): Promise<CoachClientDetail> {
  return apiRequest<CoachClientDetail>(`/coach/clients/${id}`);
}

export async function fetchClientSummary(id: string): Promise<CoachWeeklySummary> {
  return apiRequest<CoachWeeklySummary>(`/coach/clients/${id}/summary`);
}

export async function assignClient(clientId: string): Promise<void> {
  await apiRequest('/coach/assignments', {
    method: 'POST',
    body: JSON.stringify({ clientId }),
  });
}

export async function unassignClient(clientId: string): Promise<void> {
  await apiRequest(`/coach/assignments/${clientId}`, { method: 'DELETE' });
}

export async function fetchCohorts(): Promise<CoachCohort[]> {
  return apiRequest<CoachCohort[]>('/coach/cohorts');
}

export async function fetchTeamStats(): Promise<{
  organization: string | null;
  coaches: CoachTeamMember[];
}> {
  return apiRequest('/coach/team');
}

export async function fetchMessages(clientId: string): Promise<CoachMessage[]> {
  return apiRequest<CoachMessage[]>(`/coach/messages/${clientId}`);
}

export async function sendMessage(
  clientId: string,
  body: string,
  mealId?: string,
): Promise<CoachMessage> {
  return apiRequest<CoachMessage>(`/coach/messages/${clientId}`, {
    method: 'POST',
    body: JSON.stringify({ body, mealId }),
  });
}

export async function reviewMeal(payload: ReviewMealPayload): Promise<MealSubmission> {
  return apiRequest<MealSubmission>(`/coach/meals/${payload.mealId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action: payload.action,
      note: payload.note,
      trainingNote: payload.trainingNote,
      mealName: payload.mealName,
      items: payload.items,
    }),
  });
}

export async function fetchCoachOperations(): Promise<import('@/types').CoachOperationsMetrics> {
  return apiRequest('/coach/operations');
}

export async function fetchReviewDraft(mealId: string): Promise<import('@/types').CoachReviewDraft | null> {
  return apiRequest(`/coach/meals/${mealId}/review-draft`);
}

export async function saveReviewDraft(
  mealId: string,
  payload: Omit<import('@/types').CoachReviewDraft, 'mealId' | 'updatedAt'>,
) {
  return apiRequest(`/coach/meals/${mealId}/review-draft`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchReviewTasks(mealId: string): Promise<import('@/types').MealReviewTask[]> {
  return apiRequest(`/coach/meals/${mealId}/review-tasks`);
}

export async function createReviewTask(
  mealId: string,
  payload: { type: 'second_opinion' | 'escalation'; note?: string; notifyUser?: boolean },
) {
  return apiRequest(`/coach/meals/${mealId}/review-tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type CoachReportSnapshot = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export async function fetchCoachReports(): Promise<CoachReportSnapshot[]> {
  return apiRequest<CoachReportSnapshot[]>('/reports/coach');
}

export type CoachingInsight = {
  id: string;
  type: 'tip' | 'celebration' | 'reminder' | 'coach_note' | 'trend';
  title: string;
  body: string;
  priority: number;
};

export async function fetchClientCoachingInsights(clientId: string): Promise<CoachingInsight[]> {
  return apiRequest<CoachingInsight[]>(`/coach/clients/${clientId}/coaching-insights`);
}
