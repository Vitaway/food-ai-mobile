import { apiRequest } from '@/lib/apiClient';

export type AdminMetrics = {
  coaches: number;
  consumers: number;
  meals: {
    total: number;
    inReview: number;
    analyzing: number;
    approved: number;
  };
  vision: {
    ok: boolean;
    apiKeyStatus: string;
    model: string;
  };
  payments?: {
    activeSubscriptions: number;
    pendingPayments: number;
    failedPayments: number;
    revenue: number;
    subscriptionsByType?: {
      individual: number;
      corporate: number;
      family: number;
    };
  };
  totalUsers?: number;
  activeUsersWeek?: number;
  newRegistrationsWeek?: number;
  newRegistrationsMonth?: number;
  userSources?: {
    individual: number;
    company: number;
    institution: number;
    referral: number;
    direct: number;
  };
  reports?: {
    totalSnapshots: number;
  };
  timestamp: string;
};

export type AdminCoach = {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  memberSince: string;
  profile: {
    id: string;
    title: string | null;
    organization: string | null;
    bio: string | null;
    phone: string | null;
    timezone: string | null;
  } | null;
};

export type AdminConsumer = {
  id: string;
  patientId: string;
  displayName: string;
  email: string | null;
  goal: string | null;
  healthScore: number | null;
  memberSince: string;
};

export type CreateCoachPayload = {
  email: string;
  password: string;
  displayName: string;
  title?: string;
  organization?: string;
  bio?: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminReferralRow = {
  userId: string;
  displayName: string;
  referralCode: string;
  referralCount: number;
};

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return apiRequest<AdminMetrics>('/admin/metrics');
}

export async function fetchAdminCoaches(): Promise<AdminCoach[]> {
  return apiRequest<AdminCoach[]>('/admin/coaches');
}

export async function createCoach(payload: CreateCoachPayload): Promise<AdminCoach> {
  return apiRequest<AdminCoach>('/admin/coaches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminConsumers(): Promise<AdminConsumer[]> {
  return apiRequest<AdminConsumer[]>('/admin/consumers');
}

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  registrationSource: string | null;
  createdAt: string;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  return apiRequest<AdminUserRow[]>('/admin/users');
}

export async function setUserActive(userId: string, isActive: boolean) {
  return apiRequest(`/admin/users/${userId}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchAdminSystem() {
  return apiRequest('/admin/system');
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  return apiRequest<AuditLogEntry[]>('/admin/audit-logs');
}

export async function fetchAdminReferrals(): Promise<AdminReferralRow[]> {
  return apiRequest<AdminReferralRow[]>('/admin/referrals');
}

export type GrowthPoint = { date: string; registrations: number };

export async function fetchAdminGrowth(days = 30): Promise<GrowthPoint[]> {
  return apiRequest<GrowthPoint[]>(`/admin/analytics/growth?days=${days}`);
}

export async function setUserRole(userId: string, role: string) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function fetchAdminOperations(): Promise<import('@/types').AdminOperationsMetrics> {
  return apiRequest('/admin/metrics/operations');
}

export async function fetchAdminCoachRoster(): Promise<import('@/types').AdminCoachRosterRow[]> {
  return apiRequest('/admin/coaches/roster');
}

export type PendingNutritionFood = import('@/api/nutritionDbApi').NutritionFood;

export async function fetchPendingNutritionFoods(): Promise<PendingNutritionFood[]> {
  return apiRequest('/admin/nutrition-db/pending');
}

export async function approveNutritionFood(id: string) {
  return apiRequest(`/admin/nutrition-db/foods/${id}/approve`, { method: 'POST' });
}

export async function rejectNutritionFood(id: string) {
  return apiRequest(`/admin/nutrition-db/foods/${id}/reject`, { method: 'POST' });
}

export type ModuleDefinition = {
  key: string;
  name: string;
  description: string;
  defaultAudience: string;
};

export type ModuleEntitlementAccount = {
  organizationKey: string;
  modules: string[];
  moduleLabels: string[];
  stored: boolean;
};

export type ModuleEntitlementsResponse = {
  catalog: ModuleDefinition[];
  accounts: ModuleEntitlementAccount[];
};

export async function fetchModuleEntitlements(): Promise<ModuleEntitlementsResponse> {
  return apiRequest('/admin/modules/entitlements');
}

export async function setModuleEntitlements(organizationKey: string, modules: string[]) {
  return apiRequest<ModuleEntitlementAccount>(
    `/admin/modules/entitlements/${encodeURIComponent(organizationKey)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ modules }),
    },
  );
}

export async function ensureModuleAccount(organizationKey: string) {
  return apiRequest<ModuleEntitlementAccount>('/admin/modules/entitlements', {
    method: 'POST',
    body: JSON.stringify({ organizationKey }),
  });
}
