import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCoach,
  fetchAdminCoaches,
  fetchAdminCoachRoster,
  fetchAdminClinicalAssessments,
  fetchAdminConsumers,
  fetchAdminMetrics,
  fetchAdminOperations,
  fetchAdminSystem,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchPendingNutritionFoods,
  approveNutritionFood,
  rejectNutritionFood,
  setUserActive,
  setUserRole,
  fetchModuleEntitlements,
  setModuleEntitlements,
  ensureModuleAccount,
  type CreateCoachPayload,
} from '@/features/admin/api/adminApi';

export const adminKeys = {
  all: ['admin'] as const,
  metrics: () => [...adminKeys.all, 'metrics'] as const,
  coaches: () => [...adminKeys.all, 'coaches'] as const,
  consumers: () => [...adminKeys.all, 'consumers'] as const,
  system: () => [...adminKeys.all, 'system'] as const,
  audit: () => [...adminKeys.all, 'audit'] as const,
  operations: () => [...adminKeys.all, 'operations'] as const,
  roster: () => [...adminKeys.all, 'roster'] as const,
  pendingFoods: () => [...adminKeys.all, 'pending-foods'] as const,
  modules: () => [...adminKeys.all, 'modules'] as const,
  clinicalAssessments: () => [...adminKeys.all, 'clinical-assessments'] as const,
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

export function useAdminClinicalAssessments() {
  return useQuery({
    queryKey: adminKeys.clinicalAssessments(),
    queryFn: fetchAdminClinicalAssessments,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: [...adminKeys.all, 'users'] as const,
    queryFn: fetchAdminUsers,
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

export function useAdminOperations() {
  return useQuery({
    queryKey: adminKeys.operations(),
    queryFn: fetchAdminOperations,
    refetchInterval: 30_000,
  });
}

export function useAdminCoachRoster() {
  return useQuery({
    queryKey: adminKeys.roster(),
    queryFn: fetchAdminCoachRoster,
    refetchInterval: 60_000,
  });
}

export function usePendingNutritionFoods() {
  return useQuery({
    queryKey: adminKeys.pendingFoods(),
    queryFn: fetchPendingNutritionFoods,
  });
}

export function useApproveNutritionFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveNutritionFood(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.pendingFoods() });
      void qc.invalidateQueries({ queryKey: ['admin', 'nutrition-db'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-db'] });
    },
  });
}

export function useRejectNutritionFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectNutritionFood(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.pendingFoods() });
      void qc.invalidateQueries({ queryKey: ['admin', 'nutrition-db'] });
      void qc.invalidateQueries({ queryKey: ['nutrition-db'] });
    },
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
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => setUserRole(userId, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
    },
  });
}

export function useModuleEntitlements() {
  return useQuery({
    queryKey: adminKeys.modules(),
    queryFn: fetchModuleEntitlements,
  });
}

export function useSetModuleEntitlements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationKey, modules }: { organizationKey: string; modules: string[] }) =>
      setModuleEntitlements(organizationKey, modules),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.modules() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

export function useEnsureModuleAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (organizationKey: string) => ensureModuleAccount(organizationKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.modules() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}
