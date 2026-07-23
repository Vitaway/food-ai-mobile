import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCoach,
  createAdminUser,
  fetchAdminCoaches,
  fetchAdminCoachRoster,
  fetchAdminClinicalAssessments,
  fetchAdminConsumers,
  fetchAdminMetrics,
  fetchAdminOperations,
  fetchAdminSystem,
  fetchAdminUsers,
  fetchAdminUserDetail,
  setAdminClientCoaches,
  fetchAdminPatientView,
  fetchAdminPatientSummary,
  fetchAdminClinicalAssessment,
  saveAdminClinicalAssessment,
  confirmAdminClinicalAssessment,
  updateAdminUser,
  adminResetUserPassword,
  deleteAdminUser,
  updateAdminConsumerProfile,
  updateAdminCoachProfile,
  fetchAuditLogs,
  fetchPendingNutritionFoods,
  approveNutritionFood,
  rejectNutritionFood,
  setUserActive,
  setUserRole,
  fetchModuleEntitlements,
  setModuleEntitlements,
  ensureModuleAccount,
  fetchOrganizations,
  fetchOrganization,
  fetchOrganizationMetrics,
  createOrganization,
  updateOrganization,
  type CreateCoachPayload,
  type CreateAdminUserPayload,
  type SetUserRolePayload,
  type CreateOrganizationPayload,
  type UpdateOrganizationPayload,
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
  users: () => [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.all, 'users', id] as const,
  patient: (id: string) => [...adminKeys.all, 'users', id, 'patient'] as const,
  patientSummary: (id: string) => [...adminKeys.all, 'users', id, 'patient-summary'] as const,
  adminClinicalAssessment: (id: string) => [...adminKeys.all, 'users', id, 'clinical-assessment'] as const,
  organizations: () => [...adminKeys.all, 'organizations'] as const,
  organization: (id: string) => [...adminKeys.all, 'organizations', id] as const,
  organizationMetrics: (id: string) => [...adminKeys.all, 'organizations', id, 'metrics'] as const,
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
    queryKey: adminKeys.users(),
    queryFn: fetchAdminUsers,
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.user(userId ?? ''),
    queryFn: () => fetchAdminUserDetail(userId!),
    enabled: Boolean(userId),
  });
}

export function useSetAdminClientCoaches(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coachUserIds: string[]) => setAdminClientCoaches(userId, coachUserIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.patient(userId) });
    },
  });
}

export function useAdminPatientView(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.patient(userId ?? ''),
    queryFn: () => fetchAdminPatientView(userId!),
    enabled: Boolean(userId),
  });
}

export function useAdminPatientSummary(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.patientSummary(userId ?? ''),
    queryFn: () => fetchAdminPatientSummary(userId!),
    enabled: Boolean(userId),
  });
}

export function useAdminClinicalAssessment(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.adminClinicalAssessment(userId ?? ''),
    queryFn: () => fetchAdminClinicalAssessment(userId!),
    enabled: Boolean(userId),
  });
}

export function useSaveAdminClinicalAssessment(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: import('@/api/coachApi').ClinicalAssessmentData) =>
      saveAdminClinicalAssessment(userId, payload),
    onSuccess: (assessment) => {
      qc.setQueryData(adminKeys.adminClinicalAssessment(userId), assessment);
      void qc.invalidateQueries({ queryKey: adminKeys.patient(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
    },
  });
}

export function useConfirmAdminClinicalAssessment(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { confirmationNote?: string; allowProtectedWeightLoss?: boolean }) =>
      confirmAdminClinicalAssessment(userId, payload),
    onSuccess: (assessment) => {
      qc.setQueryData(adminKeys.adminClinicalAssessment(userId), assessment);
      void qc.invalidateQueries({ queryKey: adminKeys.patient(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.clinicalAssessments() });
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: import('@/features/admin/api/adminApi').UpdateAdminUserPayload }) =>
      updateAdminUser(userId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.consumers() });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
      void qc.invalidateQueries({ queryKey: adminKeys.organizations() });
      // Invalidate all org detail/metrics queries — org id may change or clear.
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, 'organizations'] });
    },
  });
}

export function useAdminResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      password,
      sendEmail,
    }: {
      userId: string;
      password?: string;
      sendEmail?: boolean;
    }) => adminResetUserPassword(userId, { password, sendEmail }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.consumers() });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
      void qc.invalidateQueries({ queryKey: adminKeys.metrics() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

export function useUpdateAdminConsumerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: import('@/features/admin/api/adminApi').UpdateConsumerProfileAdminPayload;
    }) => updateAdminConsumerProfile(userId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.consumers() });
    },
  });
}

export function useUpdateAdminCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: import('@/features/admin/api/adminApi').UpdateCoachProfileAdminPayload;
    }) => updateAdminCoachProfile(userId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
    },
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
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.metrics() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.consumers() });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
      void qc.invalidateQueries({ queryKey: adminKeys.metrics() });
      void qc.invalidateQueries({ queryKey: adminKeys.audit() });
      void qc.invalidateQueries({ queryKey: adminKeys.modules() });
      void qc.invalidateQueries({ queryKey: adminKeys.organizations() });
      if (vars.organizationId) {
        void qc.invalidateQueries({ queryKey: adminKeys.organization(vars.organizationId) });
        void qc.invalidateQueries({ queryKey: adminKeys.organizationMetrics(vars.organizationId) });
      }
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
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...payload }: SetUserRolePayload & { userId: string }) =>
      setUserRole(userId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
      void qc.invalidateQueries({ queryKey: adminKeys.coaches() });
      void qc.invalidateQueries({ queryKey: adminKeys.consumers() });
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.userId) });
      void qc.invalidateQueries({ queryKey: adminKeys.modules() });
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

export function useOrganizations() {
  return useQuery({
    queryKey: adminKeys.organizations(),
    queryFn: fetchOrganizations,
  });
}

export function useOrganization(id: string | null) {
  return useQuery({
    queryKey: adminKeys.organization(id ?? ''),
    queryFn: () => fetchOrganization(id!),
    enabled: Boolean(id),
  });
}

export function useOrganizationMetrics(id: string | null) {
  return useQuery({
    queryKey: adminKeys.organizationMetrics(id ?? ''),
    queryFn: () => fetchOrganizationMetrics(id!),
    enabled: Boolean(id),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) => createOrganization(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizations() });
      void qc.invalidateQueries({ queryKey: adminKeys.modules() });
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganizationPayload }) =>
      updateOrganization(id, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizations() });
      void qc.invalidateQueries({ queryKey: adminKeys.organization(vars.id) });
      void qc.invalidateQueries({ queryKey: adminKeys.organizationMetrics(vars.id) });
    },
  });
}
