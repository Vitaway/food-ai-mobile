import { apiRequest, getApiAuthToken } from '@/lib/apiClient';
import { API_BASE_URL } from '@/constants/api';
import type { MealSubmission, UserProfile } from '@/types';
import { prepareImageForUpload } from '@/utils/prepareUploadImage';

export type ConsumerProfileResponse = {
  patientId: string;
  userId: string | null;
  profile: UserProfile;
  memberSince: string;
  updatedAt: string;
};

export async function fetchConsumerProfile(): Promise<ConsumerProfileResponse> {
  return apiRequest<ConsumerProfileResponse>('/consumer/profile');
}

export async function updateConsumerProfile(
  payload: Partial<UserProfile>,
): Promise<ConsumerProfileResponse> {
  return apiRequest<ConsumerProfileResponse>('/consumer/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function uploadConsumerAvatar(imageUri: string): Promise<ConsumerProfileResponse> {
  if (!API_BASE_URL) {
    throw new Error('API is not configured');
  }

  const token = getApiAuthToken();
  if (!token) {
    throw new Error('Sign in to upload a profile photo');
  }

  const upload = await prepareImageForUpload(imageUri);
  const formData = new FormData();
  formData.append('image', {
    uri: upload.uri,
    type: upload.mimeType,
    name: upload.name,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/v1/consumer/profile/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: ConsumerProfileResponse;
    error?: string;
    message?: string;
  };

  if (!response.ok || body.success === false) {
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      `Upload failed (${response.status})`;
    throw new Error(message);
  }

  if (body.success === true && body.data) {
    return body.data;
  }

  return body as unknown as ConsumerProfileResponse;
}

export async function fetchConsumerMeals(): Promise<MealSubmission[]> {
  return apiRequest<MealSubmission[]>('/consumer/meals');
}

export type ConsumerDashboardResponse = {
  date: string;
  waterMl: number;
  waterTargetMl: number;
  caloriesConsumed: number;
  calorieTarget: number;
};

export async function fetchConsumerDashboard(): Promise<ConsumerDashboardResponse> {
  return apiRequest<ConsumerDashboardResponse>('/consumer/dashboard');
}

function mealPayload(meal: MealSubmission) {
  const { id, mealType, status, submittedAt, ...data } = meal;
  return {
    id,
    mealType,
    status: status === 'approved' ? 'in_review' : status,
    submittedAt,
    data,
  };
}

export async function submitConsumerMeal(meal: MealSubmission): Promise<MealSubmission> {
  return apiRequest<MealSubmission>('/consumer/meals', {
    method: 'POST',
    body: JSON.stringify(mealPayload(meal)),
  });
}

export type ServerNotification = {
  id: string;
  kind: 'meal' | 'referral' | 'system';
  title: string;
  message: string;
  mealId: string | null;
  status: string | null;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export async function fetchNotifications(): Promise<ServerNotification[]> {
  return apiRequest<ServerNotification[]>('/consumer/notifications');
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  return apiRequest<number>('/consumer/notifications/unread-count');
}

export async function markNotificationRead(id: string): Promise<ServerNotification> {
  return apiRequest<ServerNotification>(`/consumer/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/consumer/notifications/read-all', {
    method: 'POST',
  });
}

export async function registerPushToken(token: string, platform: 'ios' | 'android' | 'web') {
  return apiRequest<{ ok: boolean }>('/consumer/notifications/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

export async function unregisterPushToken(token: string) {
  return apiRequest<{ ok: boolean }>('/consumer/notifications/push-token/unregister', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export type ReferralInfo = {
  referralCode: string;
  referralCount: number;
  referredBy: { displayName: string; joinedAt: string } | null;
};

export async function fetchReferralInfo(): Promise<ReferralInfo> {
  return apiRequest<ReferralInfo>('/consumer/referral');
}

export type LogWaterResponse = {
  date: string;
  waterMl: number;
  waterTargetMl: number;
  addedMl: number;
};

export async function logConsumerWater(amountMl: number, date?: string): Promise<LogWaterResponse> {
  return apiRequest<LogWaterResponse>('/consumer/water', {
    method: 'POST',
    body: JSON.stringify({ amountMl, date }),
  });
}
