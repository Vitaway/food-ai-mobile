import { apiRequest, ApiError, getApiAuthToken } from '@/lib/apiClient';
import { emitUnauthorized } from '@/lib/authEvents';
import { API_BASE_URL, getApiV1Url } from '@/constants/api';
import type { MealSubmission, UserProfile } from '@/types';
import { ensureServingFields } from '@/utils/servingUnits';
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

  const response = await fetch(getApiV1Url('/consumer/profile/avatar'), {
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
    if (response.status === 401 && token) {
      emitUnauthorized();
    }
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      `Upload failed (${response.status})`;
    throw new ApiError(message, response.status);
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
  macrosConsumed: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  healthScore: number;
  healthScoreBreakdown: {
    nutrientScore: number;
    macroScore: number;
    calorieScore: number;
    consistencyScore: number;
    varietyScore: number;
  };
  streakDays: number;
};

export async function fetchConsumerDashboard(date?: string): Promise<ConsumerDashboardResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest<ConsumerDashboardResponse>(`/consumer/dashboard${query}`);
}

export type HealthScoreHistoryEntry = {
  date: string;
  totalScore: number;
  nutrientScore: number;
  macroScore: number;
  calorieScore: number;
  consistencyScore: number;
  varietyScore: number;
};

export async function fetchHealthScoreHistory(days = 30): Promise<HealthScoreHistoryEntry[]> {
  return apiRequest<HealthScoreHistoryEntry[]>(`/consumer/health-scores?days=${days}`);
}

export type ConsumerSubscription = {
  id: string;
  planCode: string;
  subscriptionType: 'individual' | 'corporate' | 'family';
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  renewsOn: string | null;
  trialEndsOn: string | null;
};

export async function fetchConsumerSubscription(): Promise<ConsumerSubscription | null> {
  return apiRequest<ConsumerSubscription | null>('/consumer/subscription');
}

export type CheckoutResponse = {
  externalRef: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
  status: string;
  subscriptionId: string;
};

export async function createConsumerCheckout(payload: {
  planCode: string;
  organizationId?: string;
  organizationName?: string;
  /** @deprecated ignored by server */
  amount?: number;
  subscriptionType?: 'individual' | 'corporate' | 'family';
  currency?: string;
}): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({
      planCode: payload.planCode,
      organizationId: payload.organizationId,
      organizationName: payload.organizationName,
    }),
  });
}

export type SubscriptionPlan = {
  code: string;
  label: string;
  amount: number;
  currency: string;
  subscriptionType: 'individual' | 'corporate' | 'family';
};

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>('/payments/plans');
}

export async function fetchFamilySubscription() {
  return apiRequest<{
    id: string;
    planCode: string;
    status: string;
    members: Array<{ userId: string; displayName: string; email: string; role: string }>;
  } | null>('/consumer/subscription/family');
}

export async function activateFamilySubscription() {
  return apiRequest('/consumer/subscription/family/activate', { method: 'POST' });
}

export async function addFamilyMember(email: string) {
  return apiRequest('/consumer/subscription/family/members', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export type ConsumerReportSnapshot = {
  id: string;
  period: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export async function fetchConsumerReports(): Promise<ConsumerReportSnapshot[]> {
  return apiRequest<ConsumerReportSnapshot[]>('/consumer/reports');
}

function mealPayload(meal: MealSubmission) {
  const { id, mealType, status, submittedAt, ...data } = meal;
  const payloadData = { ...data };
  if (Array.isArray(payloadData.items)) {
    payloadData.items = payloadData.items.map((item) => ensureServingFields(item));
  }
  if (typeof payloadData.imageUrl === 'string' && isLocalImageUri(payloadData.imageUrl)) {
    delete payloadData.imageUrl;
  }
  return {
    id,
    mealType,
    status: status === 'approved' ? 'in_review' : status,
    submittedAt,
    data: payloadData,
  };
}

export function isLocalImageUri(uri: string | undefined): boolean {
  if (!uri) return false;
  const lower = uri.toLowerCase();
  return lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('ph://');
}

export function hasServerImageUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

async function postMealMultipart(payload: ReturnType<typeof mealPayload>, imageUri: string) {
  if (!API_BASE_URL) {
    throw new Error('API is not configured');
  }

  const token = getApiAuthToken();
  if (!token) {
    throw new Error('Sign in to submit meals');
  }

  const upload = await prepareImageForUpload(imageUri);
  const formData = new FormData();
  formData.append('meal', JSON.stringify(payload));
  formData.append('image', {
    uri: upload.uri,
    type: upload.mimeType,
    name: upload.name,
  } as unknown as Blob);

  const response = await fetch(getApiV1Url('/consumer/meals/with-photo'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: MealSubmission;
    error?: string;
    message?: string;
  };

  if (!response.ok || body.success === false) {
    if (response.status === 401 && token) {
      emitUnauthorized();
    }
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      (response.status === 404 ? 'Route not found' : `Submit failed (${response.status})`);
    throw new ApiError(message, response.status);
  }

  if (body.success === true && body.data) {
    return body.data;
  }

  return body as unknown as MealSubmission;
}

export async function submitConsumerMeal(
  meal: MealSubmission,
  localImageUri?: string,
): Promise<MealSubmission> {
  const payload = mealPayload(meal);
  const imageUri =
    localImageUri ??
    (meal.imageUrl && isLocalImageUri(meal.imageUrl) ? meal.imageUrl : undefined);

  if (imageUri) {
    return postMealMultipart(payload, imageUri);
  }

  return apiRequest<MealSubmission>('/consumer/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Upload photos for meals that were saved with device-only URLs before server upload existed. */
export async function backfillMealPhotos(
  remoteMeals: MealSubmission[],
  localMeals: MealSubmission[],
): Promise<void> {
  for (const remote of remoteMeals) {
    if (hasServerImageUrl(remote.imageUrl)) continue;

    const local = localMeals.find((entry) => entry.id === remote.id);
    const localUri =
      local?.imageUrl && isLocalImageUri(local.imageUrl)
        ? local.imageUrl
        : remote.imageUrl && isLocalImageUri(remote.imageUrl)
          ? remote.imageUrl
          : undefined;

    if (!localUri) continue;

    try {
      await uploadMealPhoto(remote.id, localUri);
    } catch {
      /* keep trying other meals */
    }
  }
}

export async function uploadMealPhoto(mealId: string, imageUri: string): Promise<{ imageUrl: string }> {
  if (!API_BASE_URL) {
    throw new Error('API is not configured');
  }

  const token = getApiAuthToken();
  if (!token) {
    throw new Error('Sign in to upload meal photos');
  }

  const upload = await prepareImageForUpload(imageUri);
  const formData = new FormData();
  formData.append('image', {
    uri: upload.uri,
    type: upload.mimeType,
    name: upload.name,
  } as unknown as Blob);

  const response = await fetch(getApiV1Url(`/consumer/meals/${mealId}/photo`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { imageUrl: string };
    error?: string;
    message?: string;
  };

  if (!response.ok || body.success === false) {
    if (response.status === 401 && token) {
      emitUnauthorized();
    }
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      `Upload failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  const imageUrl = body.data?.imageUrl;
  if (!imageUrl) {
    throw new Error('Upload succeeded but no image URL was returned');
  }

  return { imageUrl };
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

export type CoachingFeedItem = {
  id: string;
  type: 'tip' | 'celebration' | 'reminder' | 'coach_note' | 'trend';
  title: string;
  body: string;
  priority: number;
  actionLabel?: string;
  actionRoute?: string;
};

export async function fetchCoachingFeed(): Promise<CoachingFeedItem[]> {
  return apiRequest<CoachingFeedItem[]>('/consumer/coaching-feed');
}

export async function exportAccountData() {
  return apiRequest<Record<string, unknown>>('/consumer/data-export');
}

export async function deleteAccountRemote() {
  return apiRequest<{ ok: boolean; deletedAt: string }>('/consumer/account', {
    method: 'DELETE',
  });
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
