import { apiRequest } from '@/lib/apiClient';
import type { CoachAnalytics } from '@/components/coach/DashboardCharts';
import type {
  CoachClient,
  CoachDashboardStats,
  CoachProfile,
  CoachQueueItem,
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

export async function fetchCoachProfile(): Promise<CoachProfile> {
  const data = await apiRequest<CoachProfileResponse>('/coach/profile');
  return mapCoachProfile(data);
}

export async function updateCoachProfile(
  payload: UpdateCoachProfilePayload,
): Promise<CoachProfile> {
  const data = await apiRequest<CoachProfileResponse>('/coach/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      displayName: payload.displayName,
      title: payload.jobTitle,
      bio: payload.bio,
      phone: payload.phone,
      timezone: payload.timezone,
      avatarUrl: payload.avatarUrl,
    }),
  });
  return mapCoachProfile(data);
}

export async function updateCoachPassword(_payload: UpdateCoachPasswordPayload): Promise<void> {
  throw new Error('Password change is not available yet. Contact support@vitaway.com.');
}

export async function fetchCoachStats(): Promise<CoachDashboardStats> {
  return apiRequest<CoachDashboardStats>('/coach/stats');
}

export async function fetchCoachAnalytics(): Promise<CoachAnalytics> {
  return apiRequest<CoachAnalytics>('/coach/analytics');
}

export async function fetchCoachQueue(): Promise<CoachQueueItem[]> {
  return apiRequest<CoachQueueItem[]>('/coach/queue');
}

export async function fetchMealById(id: string): Promise<CoachQueueItem | null> {
  return apiRequest<CoachQueueItem | null>(`/coach/meals/${id}`);
}

export async function fetchClients(): Promise<CoachClient[]> {
  return apiRequest<CoachClient[]>('/coach/clients');
}

export async function reviewMeal(payload: ReviewMealPayload): Promise<MealSubmission> {
  return apiRequest<MealSubmission>(`/coach/meals/${payload.mealId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action: payload.action,
      note: payload.note,
      mealName: payload.mealName,
      items: payload.items,
    }),
  });
}
