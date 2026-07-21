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
  userId: string | null;
  displayName: string;
  email: string | null;
  goal: string | null;
  healthScore: number | null;
  membershipTier: 'standard' | 'pro';
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

export type CreateAdminUserPayload = {
  email: string;
  password?: string;
  displayName: string;
  role:
    | 'consumer'
    | 'coach'
    | 'nutrition_coach'
    | 'organization_admin'
    | 'data_entry_staff'
    | 'admin';
  membershipTier?: 'standard' | 'pro';
  registrationSource?: 'individual' | 'company' | 'institution' | 'referral' | 'admin_created';
  sendInviteEmail?: boolean;
  organization?: string;
  organizationId?: string;
  title?: string;
  bio?: string;
  goal?: string;
  allergies?: string[];
};

export type CreateAdminUserResult = {
  user: AdminUserRow & {
    avatarUrl: string | null;
    referralCode: string | null;
    referredByUserId: string | null;
    updatedAt: string;
  };
  patientId: string | null;
  consumerProfile: { id: string; patientId: string } | null;
  coachProfile: AdminCoach['profile'];
  emailSent: boolean;
  temporaryPassword?: string;
};

export type AdminClinicalAssessmentRow = {
  clientId: string;
  displayName: string;
  status: 'incomplete' | 'draft' | 'confirmed';
  risk: 'low' | 'medium' | 'high';
  assignedCoach: string | null;
  targetStatus: 'unavailable' | 'provisional' | 'confirmed';
  safetyFlags: string[];
  updatedAt: string | null;
};

export async function fetchAdminClinicalAssessments(): Promise<AdminClinicalAssessmentRow[]> {
  return apiRequest('/admin/clinical-assessments');
}

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

export async function createAdminUser(payload: CreateAdminUserPayload): Promise<CreateAdminUserResult> {
  return apiRequest<CreateAdminUserResult>('/admin/users', {
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
  phone: string | null;
  role: string;
  isActive: boolean;
  membershipTier: 'standard' | 'pro';
  registrationSource: string | null;
  createdAt: string;
  patientId: string | null;
  goal: string | null;
  healthScore: number | null;
  organizationId?: string | null;
  organization: string | null;
  title: string | null;
};

export type SetUserRolePayload = {
  role:
    | 'consumer'
    | 'coach'
    | 'nutrition_coach'
    | 'organization_admin'
    | 'data_entry_staff'
    | 'admin';
  organization?: string;
  organizationId?: string;
  title?: string;
};

export type AdminUserDetail = {
  user: AdminUserRow & {
    avatarUrl: string | null;
    referralCode: string | null;
    referredByUserId: string | null;
    organizationId?: string | null;
    updatedAt: string;
  };
  organization?: {
    id: string;
    name: string;
    status: string;
  } | null;
  consumerProfile: {
    id: string;
    patientId: string;
    profile: Record<string, unknown>;
    dashboard: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } | null;
  coachProfile: {
    id: string;
    title: string | null;
    organization: string | null;
    bio: string | null;
    phone: string | null;
    timezone: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  subscription: {
    id: string;
    planCode: string;
    subscriptionType: string;
    status: string;
    renewsOn: string | null;
    trialEndsOn: string | null;
    createdAt: string;
  } | null;
  stats: {
    referralCount: number;
    meals: {
      total: number;
      inReview: number;
      approved: number;
      rejected: number;
      analyzing: number;
    };
  };
  assignedCoachIds: string[];
  recentMeals: Array<{
    id: string;
    clientId: string;
    status: string;
    mealType: string;
    mealName: string;
    submittedAt: string;
    calories: number;
  }>;
};

export type UpdateAdminUserPayload = {
  displayName?: string;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
  role?: string;
  membershipTier?: 'standard' | 'pro';
  organization?: string;
  organizationId?: string;
  title?: string;
};

export type UpdateConsumerProfileAdminPayload = {
  displayName?: string;
  goal?: string;
  goalPace?: string;
  allergies?: string[];
  notes?: string;
};

export type UpdateCoachProfileAdminPayload = {
  title?: string;
  organization?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  return apiRequest<AdminUserRow[]>('/admin/users');
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${userId}`);
}

export async function setAdminClientCoaches(userId: string, coachUserIds: string[]) {
  return apiRequest<{ clientId: string; assignedCoachIds: string[] }>(
    `/admin/users/${userId}/coaches`,
    {
      method: 'PUT',
      body: JSON.stringify({ coachUserIds }),
    },
  );
}

export async function updateAdminUser(userId: string, payload: UpdateAdminUserPayload) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminResetUserPassword(
  userId: string,
  payload?: { password?: string; sendEmail?: boolean },
) {
  return apiRequest<{ ok: boolean; emailSent: boolean; temporaryPassword?: string }>(
    `/admin/users/${userId}/reset-password`,
    {
      method: 'POST',
      body: JSON.stringify(payload ?? { sendEmail: true }),
    },
  );
}

export async function fetchAdminPatientView(userId: string) {
  return apiRequest<import('@/types').CoachClientDetail>(`/admin/users/${userId}/patient`);
}

export async function fetchAdminPatientSummary(userId: string) {
  return apiRequest<import('@/types').CoachWeeklySummary>(`/admin/users/${userId}/patient/summary`);
}

export async function fetchAdminPatientCoachingInsights(userId: string) {
  return apiRequest<Array<{ id: string; title: string; body: string }>>(
    `/admin/users/${userId}/patient/coaching-insights`,
  );
}

export async function fetchAdminClinicalAssessment(userId: string) {
  return apiRequest<import('@/api/coachApi').ClinicalAssessment>(
    `/admin/users/${userId}/clinical-assessment`,
  );
}

export async function saveAdminClinicalAssessment(
  userId: string,
  payload: import('@/api/coachApi').ClinicalAssessmentData,
) {
  return apiRequest<import('@/api/coachApi').ClinicalAssessment>(
    `/admin/users/${userId}/clinical-assessment`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

export async function confirmAdminClinicalAssessment(
  userId: string,
  payload: { confirmationNote?: string; allowProtectedWeightLoss?: boolean },
) {
  return apiRequest<import('@/api/coachApi').ClinicalAssessment>(
    `/admin/users/${userId}/clinical-assessment/confirm`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

export async function updateAdminConsumerProfile(
  userId: string,
  payload: UpdateConsumerProfileAdminPayload,
) {
  return apiRequest(`/admin/users/${userId}/consumer-profile`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCoachProfile(
  userId: string,
  payload: UpdateCoachProfileAdminPayload,
) {
  return apiRequest(`/admin/users/${userId}/coach-profile`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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

export async function setUserRole(userId: string, payload: SetUserRolePayload) {
  return apiRequest(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
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

export type AdminOrganization = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrganizationDetail = AdminOrganization & {
  members: Array<{
    id: string;
    email: string;
    displayName: string;
    role: string;
    isActive: boolean;
    patientId: string | null;
    title: string | null;
    createdAt: string;
  }>;
};

export type CreateOrganizationPayload = {
  name: string;
  status?: 'active' | 'inactive';
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export type UpdateOrganizationPayload = {
  name?: string;
  status?: 'active' | 'inactive';
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
};

export async function fetchOrganizations(): Promise<AdminOrganization[]> {
  return apiRequest('/admin/organizations');
}

export async function fetchOrganization(id: string): Promise<AdminOrganizationDetail> {
  return apiRequest(`/admin/organizations/${id}`);
}

export async function createOrganization(payload: CreateOrganizationPayload) {
  return apiRequest<AdminOrganization>('/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrganization(id: string, payload: UpdateOrganizationPayload) {
  return apiRequest<AdminOrganization>(`/admin/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
