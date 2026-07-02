import { apiRequest } from '@/lib/apiClient';
import type { DailyDashboard, MealSubmission, UserProfile } from '@/types';

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

export async function fetchConsumerDashboard(): Promise<DailyDashboard> {
  return apiRequest<DailyDashboard>('/consumer/dashboard');
}

export async function fetchConsumerMeals(): Promise<MealSubmission[]> {
  return apiRequest<MealSubmission[]>('/consumer/meals');
}

export async function fetchConsumerMeal(id: string): Promise<MealSubmission> {
  return apiRequest<MealSubmission>(`/consumer/meals/${id}`);
}
