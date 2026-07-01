import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCoach,
  fetchAdminCoaches,
  fetchAdminConsumers,
  fetchAdminMetrics,
  fetchAdminSystem,
  fetchAuditLogs,
  setUserActive,
  type CreateCoachPayload,
} from '@/features/admin/api/adminApi';

export const adminKeys = {
  all: ['admin'] as const,
  metrics: () => [...adminKeys.all, 'metrics'] as const,
  coaches: () => [...adminKeys.all, 'coaches'] as const,
  consumers: () => [...adminKeys.all, 'consumers'] as const,
  system: () => [...adminKeys.all, 'system'] as const,
  audit: () => [...adminKeys.all, 'audit'] as const,
};

export function useAdminMetrics() {
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: fetchAdminMetrics,
    refetchInterval: 30_000,
  });
}

export function useAdminCoaches() {
  return useQuery({
    queryKey: adminKeys.coaches(),
    queryFn: fetchAdminCoaches,
  });
}

export function useAdminConsumers() {
  return useQuery({
    queryKey: adminKeys.consumers(),
    queryFn: fetchAdminConsumers,
  });
}

export function useAdminSystem() {
  return useQuery({
    queryKey: adminKeys.system(),
    queryFn: fetchAdminSystem,
    refetchInterval: 60_000,
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: adminKeys.audit(),
    queryFn: fetchAuditLogs,
  });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoachPayload) => createCoach(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
      void qc.invalidateQueries({ queryKey: adminKeys.metrics() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setUserActive(userId, isActive),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
    },
  });
}
