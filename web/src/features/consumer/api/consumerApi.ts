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

export type SubscriptionPlan = {
  code: string;
  label: string;
  amount: number;
  currency: string;
  subscriptionType: string;
  intervalDays?: number;
};

export type SubscriptionAccess = {
  allowed: boolean;
  status: string | null;
  renewsOn: string | null;
  reason: string | null;
};

export type ConsumerPaymentRow = {
  id: string;
  externalRef: string;
  invoiceNumber: string | null;
  planCode: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  processedAt: string | null;
};

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>('/payments/plans');
}

export async function fetchSubscriptionAccess(): Promise<SubscriptionAccess> {
  return apiRequest<SubscriptionAccess>('/consumer/subscription/access');
}

export async function createConsumerCheckout(payload: { planCode: string }) {
  return apiRequest<{
    externalRef: string;
    checkoutUrl: string;
    amount: number;
    currency: string;
    status: string;
  }>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchConsumerPayments() {
  return apiRequest<{
    subscription: {
      id: string;
      planCode: string;
      subscriptionType: string;
      status: string;
      renewsOn: string | null;
    } | null;
    payments: ConsumerPaymentRow[];
  }>('/consumer/payments');
}

export type ConsumerReportSnapshot = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  createdAt: string;
};

export async function fetchConsumerReports(): Promise<ConsumerReportSnapshot[]> {
  return apiRequest<ConsumerReportSnapshot[]>('/consumer/reports');
}

export async function generateConsumerReport(period: 'weekly' | 'monthly' = 'weekly') {
  return apiRequest<ConsumerReportSnapshot>(`/consumer/reports/generate?period=${period}`, {
    method: 'POST',
  });
}
