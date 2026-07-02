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
