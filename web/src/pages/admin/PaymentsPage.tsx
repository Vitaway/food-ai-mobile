import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DashboardPageHeader } from '@/components/layout/DashboardPageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/context/ToastContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { apiRequest } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type PaymentSummary = {
  totalRevenue: number;
  mtdRevenue: number;
  todayRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  succeededPayments: number;
  cancelledPayments: number;
  failureRate: number;
  activeSubscriptions: number;
  subscriptionsByType: {
    individual: number;
    corporate: number;
    family: number;
  };
  subscriptionsByPlan: {
    individual_weekly: number;
    individual_monthly: number;
    family_monthly: number;
    corporate_monthly: number;
  };
  dailyRevenue: Array<{ date: string; revenue: number }>;
  upcomingRenewals: Array<{
    id: string;
    planCode: string;
    subscriptionType: string;
    renewsOn: string;
  }>;
  recentPayments: Array<{
    id: string;
    externalRef: string;
    invoiceNumber: string | null;
    planCode: string | null;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
};

type AdminPlan = {
  code: string;
  label: string;
  amount: number;
  currency: string;
  subscriptionType: string;
  intervalDays: number;
  isPublic: boolean;
  isActive: boolean;
  updatedAt: string;
};

type PlanDraft = {
  label: string;
  amount: string;
  intervalDays: string;
  isPublic: boolean;
  isActive: boolean;
};

type PlanRow = AdminPlan & { draft: PlanDraft };

function normalizeSummary(raw: Partial<PaymentSummary> | undefined): PaymentSummary | null {
  if (!raw) return null;
  const byPlan = raw.subscriptionsByPlan ?? {
    individual_weekly: 0,
    individual_monthly: 0,
    family_monthly: 0,
    corporate_monthly: 0,
  };
  return {
    totalRevenue: Number(raw.totalRevenue ?? 0),
    mtdRevenue: Number(raw.mtdRevenue ?? 0),
    todayRevenue: Number(raw.todayRevenue ?? 0),
    pendingPayments: Number(raw.pendingPayments ?? 0),
    failedPayments: Number(raw.failedPayments ?? 0),
    succeededPayments: Number(raw.succeededPayments ?? 0),
    cancelledPayments: Number(raw.cancelledPayments ?? 0),
    failureRate: Number(raw.failureRate ?? 0),
    activeSubscriptions: Number(raw.activeSubscriptions ?? 0),
    subscriptionsByType: {
      individual: Number(raw.subscriptionsByType?.individual ?? 0),
      corporate: Number(raw.subscriptionsByType?.corporate ?? 0),
      family: Number(raw.subscriptionsByType?.family ?? 0),
    },
    subscriptionsByPlan: {
      individual_weekly: Number(byPlan.individual_weekly ?? 0),
      individual_monthly: Number(byPlan.individual_monthly ?? 0),
      family_monthly: Number(byPlan.family_monthly ?? 0),
      corporate_monthly: Number(byPlan.corporate_monthly ?? 0),
    },
    dailyRevenue: Array.isArray(raw.dailyRevenue) ? raw.dailyRevenue : [],
    upcomingRenewals: Array.isArray(raw.upcomingRenewals) ? raw.upcomingRenewals : [],
    recentPayments: Array.isArray(raw.recentPayments) ? raw.recentPayments : [],
  };
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-ash-grey-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-ash-grey-100 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ash-grey-100 text-ash-grey-700 transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden>
            ▾
          </span>
          <h2 className="font-sans text-sm font-semibold tracking-tight text-ash-grey-900">
            {title}
            {typeof count === 'number' ? (
              <span className="ml-2 font-normal text-ash-grey-500">({count})</span>
            ) : null}
          </h2>
        </button>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}>
        <div className="overflow-hidden">
          <div className="px-1 py-1 sm:px-2 sm:py-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { data: rawSummary, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => apiRequest<Partial<PaymentSummary>>('/payments/summary'),
  });
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    error: plansErr,
  } = useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: () => apiRequest<AdminPlan[]>('/admin/subscription-plans'),
    retry: 1,
  });

  const data = useMemo(() => normalizeSummary(rawSummary), [rawSummary]);

  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({});
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    code: '',
    label: '',
    amount: '15000',
    intervalDays: '30',
    subscriptionType: 'individual' as 'individual' | 'corporate' | 'family',
    isPublic: true,
  });

  useEffect(() => {
    if (!plans) return;
    const next: Record<string, PlanDraft> = {};
    for (const plan of plans) {
      next[plan.code] = {
        label: plan.label,
        amount: String(plan.amount),
        intervalDays: String(plan.intervalDays),
        isPublic: plan.isPublic,
        isActive: plan.isActive,
      };
    }
    setDrafts(next);
  }, [plans]);

  const savePlan = useMutation({
    mutationFn: (code: string) => {
      const draft = drafts[code];
      if (!draft) throw new Error('Missing draft');
      return apiRequest<AdminPlan>(`/admin/subscription-plans/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: draft.label.trim(),
          amount: Number(draft.amount),
          intervalDays: Number(draft.intervalDays),
          isPublic: draft.isPublic,
          isActive: draft.isActive,
        }),
      });
    },
    onMutate: (code) => setSavingCode(code),
    onSuccess: (plan) => {
      toast.success(`“${plan.label}” saved — checkout & receipts will use this name`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not save plan'));
    },
    onSettled: () => setSavingCode(null),
  });

  const createPlan = useMutation({
    mutationFn: () =>
      apiRequest<AdminPlan>('/admin/subscription-plans', {
        method: 'POST',
        body: JSON.stringify({
          code: createForm.code.trim(),
          label: createForm.label.trim(),
          amount: Number(createForm.amount),
          intervalDays: Number(createForm.intervalDays),
          subscriptionType: createForm.subscriptionType,
          isPublic: createForm.isPublic,
          isActive: true,
          currency: 'RWF',
        }),
      }),
    onSuccess: (plan) => {
      toast.success(`Plan “${plan.label}” created — patients can choose it at checkout`);
      setCreateForm({
        code: '',
        label: '',
        amount: '15000',
        intervalDays: '30',
        subscriptionType: 'individual',
        isPublic: true,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not create plan'));
    },
  });

  async function requestSavePlan(row: PlanRow) {
    const name = row.draft.label.trim() || row.label;
    const amount = Number(row.draft.amount);
    const days = Number(row.draft.intervalDays);
    if (!name) {
      toast.error('Plan name is required');
      return;
    }
    if (!(amount > 0) || !(days > 0)) {
      toast.error('Amount and days must be greater than zero');
      return;
    }

    const ok = await confirm({
      title: 'Save plan changes?',
      description: `Update “${name}” to ${amount.toLocaleString()} RWF / ${days} days. This name and price will show on patient checkout, receipts, and emails.`,
      confirmLabel: 'Save plan',
      tone: 'primary',
    });
    if (!ok) return;
    savePlan.mutate(row.code);
  }

  async function requestCreatePlan() {
    const name = createForm.label.trim();
    const code = createForm.code.trim();
    const amount = Number(createForm.amount);
    const days = Number(createForm.intervalDays);
    if (!code || !name) {
      toast.error('Plan name and internal code are required');
      return;
    }
    if (!(amount > 0) || !(days > 0)) {
      toast.error('Amount and days must be greater than zero');
      return;
    }

    const ok = await confirm({
      title: 'Create this plan?',
      description: `Create “${name}” (${code}) at ${amount.toLocaleString()} RWF for ${days} days. Public active plans appear in patient checkout immediately.`,
      confirmLabel: 'Create plan',
      tone: 'primary',
    });
    if (!ok) return;
    createPlan.mutate();
  }

  const maxDaily = useMemo(() => {
    if (!data?.dailyRevenue?.length) return 1;
    return Math.max(1, ...data.dailyRevenue.map((d) => d.revenue));
  }, [data?.dailyRevenue]);

  const planRows: PlanRow[] = useMemo(() => {
    return (plans ?? [])
      .map((plan) => {
        const draft = drafts[plan.code];
        if (!draft) return null;
        return { ...plan, draft };
      })
      .filter((row): row is PlanRow => Boolean(row));
  }, [plans, drafts]);

  const planColumns: DataTableColumn<PlanRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Plan name',
        cell: (row) => (
          <input
            className="w-full min-w-[140px] rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm font-medium text-ash-grey-900"
            value={row.draft.label}
            placeholder="e.g. Monthly Individual"
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [row.code]: { ...row.draft, label: e.target.value },
              }))
            }
          />
        ),
      },
      {
        key: 'code',
        header: 'Internal code',
        cell: (row) => (
          <span className="font-mono text-xs text-ash-grey-500" title="Used in billing records; not shown to patients">
            {row.code}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount (RWF)',
        cell: (row) => (
          <input
            type="number"
            min={1}
            className="w-28 rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm"
            value={row.draft.amount}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [row.code]: { ...row.draft, amount: e.target.value },
              }))
            }
          />
        ),
      },
      {
        key: 'interval',
        header: 'Days',
        cell: (row) => (
          <input
            type="number"
            min={1}
            className="w-20 rounded-lg border border-ash-grey-200 px-2 py-1.5 text-sm"
            value={row.draft.intervalDays}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [row.code]: { ...row.draft, intervalDays: e.target.value },
              }))
            }
          />
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (row) => <span className="capitalize">{row.subscriptionType}</span>,
      },
      {
        key: 'public',
        header: 'Public',
        cell: (row) => (
          <input
            type="checkbox"
            checked={row.draft.isPublic}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [row.code]: { ...row.draft, isPublic: e.target.checked },
              }))
            }
          />
        ),
      },
      {
        key: 'active',
        header: 'Active',
        cell: (row) => (
          <input
            type="checkbox"
            checked={row.draft.isActive}
            onChange={(e) =>
              setDrafts((prev) => ({
                ...prev,
                [row.code]: { ...row.draft, isActive: e.target.checked },
              }))
            }
          />
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (row) => (
          <Button
            type="button"
            size="sm"
            disabled={savePlan.isPending && savingCode === row.code}
            onClick={() => void requestSavePlan(row)}>
            {savingCode === row.code ? 'Saving…' : 'Save'}
          </Button>
        ),
      },
    ],
    [savePlan.isPending, savingCode],
  );

  const renewalColumns: DataTableColumn<PaymentSummary['upcomingRenewals'][number]>[] = useMemo(
    () => [
      {
        key: 'type',
        header: 'Type',
        cell: (row) => <span className="capitalize">{row.subscriptionType}</span>,
      },
      {
        key: 'plan',
        header: 'Plan',
        cell: (row) => row.planCode,
      },
      {
        key: 'renews',
        header: 'Renews on',
        cell: (row) => new Date(row.renewsOn).toLocaleDateString(),
      },
      {
        key: 'id',
        header: 'Subscription ID',
        cell: (row) => <span className="font-mono text-xs text-ash-grey-500">{row.id}</span>,
      },
    ],
    [],
  );

  const paymentColumns: DataTableColumn<PaymentSummary['recentPayments'][number]>[] = useMemo(
    () => [
      {
        key: 'invoice',
        header: 'Invoice / ref',
        cell: (row) => (
          <span className="font-medium text-ash-grey-900">
            {row.invoiceNumber ?? row.externalRef}
          </span>
        ),
      },
      {
        key: 'plan',
        header: 'Plan',
        cell: (row) => row.planCode ?? '—',
      },
      {
        key: 'amount',
        header: 'Amount',
        cell: (row) => (
          <span>
            {row.amount.toLocaleString()} {row.currency}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: (row) => <span className="capitalize">{row.status}</span>,
      },
      {
        key: 'time',
        header: 'Created',
        cell: (row) => new Date(row.createdAt).toLocaleString(),
      },
    ],
    [],
  );

  const plansSection = (
    <CollapsibleSection
      title="Subscription plans (create & edit pricing)"
      count={planRows.length || undefined}
      defaultOpen>
      <div className="space-y-4 px-3 py-3">
        <div className="rounded-xl border border-blue-spruce-100 bg-blue-spruce-50/60 p-4">
          <p className="text-sm font-semibold text-ash-grey-900">Create a new plan</p>
          <p className="mt-1 text-xs text-ash-grey-600">
            Plan name is what patients see on checkout, receipts, and emails. Internal code is for
            billing records only.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <label className="text-sm md:col-span-1">
              <span className="text-ash-grey-500">Plan name</span>
              <input
                className="mt-1 w-full rounded-lg border border-ash-grey-200 px-2 py-1.5"
                placeholder="Monthly Individual"
                value={createForm.label}
                onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
              />
            </label>
            <label className="text-sm md:col-span-1">
              <span className="text-ash-grey-500">Internal code</span>
              <input
                className="mt-1 w-full rounded-lg border border-ash-grey-200 px-2 py-1.5 font-mono text-sm"
                placeholder="individual_monthly"
                value={createForm.code}
                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-ash-grey-500">Amount (RWF)</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-ash-grey-200 px-2 py-1.5"
                value={createForm.amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-ash-grey-500">Days</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-ash-grey-200 px-2 py-1.5"
                value={createForm.intervalDays}
                onChange={(e) => setCreateForm((f) => ({ ...f, intervalDays: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-ash-grey-500">Type</span>
              <select
                className="mt-1 w-full rounded-lg border border-ash-grey-200 px-2 py-1.5"
                value={createForm.subscriptionType}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    subscriptionType: e.target.value as typeof f.subscriptionType,
                  }))
                }>
                <option value="individual">Individual</option>
                <option value="family">Family</option>
                <option value="corporate">Corporate</option>
              </select>
            </label>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 pb-2 text-sm text-ash-grey-700">
                <input
                  type="checkbox"
                  checked={createForm.isPublic}
                  onChange={(e) => setCreateForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
                Public
              </label>
              <Button
                type="button"
                size="sm"
                disabled={createPlan.isPending || !createForm.code || !createForm.label}
                onClick={() => void requestCreatePlan()}>
                {createPlan.isPending ? 'Creating…' : 'Create plan'}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm font-semibold text-ash-grey-900">Edit plans</p>
        <p className="text-xs text-ash-grey-500">
          Change the plan name, amount, or days, then Save. You will be asked to confirm before
          anything is updated.
        </p>
        {plansLoading ? (
          <p className="py-4 text-sm text-ash-grey-500">Loading plans…</p>
        ) : plansError ? (
          <p className="py-4 text-sm text-amber-700">
            {(plansErr as Error)?.message ||
              'Could not load plans. Sign in as admin and ensure the API is running.'}
          </p>
        ) : (
          <DataTable
            columns={planColumns}
            rows={planRows}
            rowKey={(row) => row.code}
            emptyTitle="No subscription plans"
            emptyDescription="Create a plan above to offer it at checkout."
          />
        )}
      </div>
    </CollapsibleSection>
  );

  return (
    <div className="space-y-6">
      {confirmDialog}
      <div>
        <DashboardPageHeader title="Billing & plans" className="mb-2" />
        <p className="text-sm text-ash-grey-600">
          Create and price subscription plans here (open section below). Patients pay via IremboPay;
          coaches are not charged. Successful payments email a PDF receipt automatically.
        </p>
      </div>

      {plansSection}

      {isLoading ? <p className="text-sm text-ash-grey-500">Loading payment summary...</p> : null}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Total revenue</p>
                <p className="text-2xl font-bold">{data.totalRevenue.toLocaleString()} RWF</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">MTD revenue</p>
                <p className="text-2xl font-bold">{data.mtdRevenue.toLocaleString()} RWF</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Today</p>
                <p className="text-2xl font-bold">{data.todayRevenue.toLocaleString()} RWF</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Active subscriptions</p>
                <p className="text-2xl font-bold">{data.activeSubscriptions}</p>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Succeeded</p>
                <p className="text-xl font-bold">{data.succeededPayments}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Pending / failed</p>
                <p className="text-xl font-bold">
                  {data.pendingPayments} / {data.failedPayments}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Failure rate</p>
                <p className="text-xl font-bold">{data.failureRate}%</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Cancelled txs</p>
                <p className="text-xl font-bold">{data.cancelledPayments}</p>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Weekly</p>
                <p className="text-xl font-bold">{data.subscriptionsByPlan.individual_weekly}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Monthly</p>
                <p className="text-xl font-bold">{data.subscriptionsByPlan.individual_monthly}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Family</p>
                <p className="text-xl font-bold">{data.subscriptionsByPlan.family_monthly}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-ash-grey-500">Corporate</p>
                <p className="text-xl font-bold">{data.subscriptionsByPlan.corporate_monthly}</p>
              </CardBody>
            </Card>
          </div>

          {data.dailyRevenue.length ? (
            <CollapsibleSection title="Last 14 days revenue" defaultOpen={false}>
              <div className="flex h-32 items-end gap-1 px-3 py-3">
                {data.dailyRevenue.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-emerald-600/80"
                      style={{ height: `${Math.max(4, (day.revenue / maxDaily) * 100)}%` }}
                      title={`${day.date}: ${day.revenue.toLocaleString()} RWF`}
                    />
                    <span className="text-[10px] text-ash-grey-400">{day.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title="Upcoming renewals"
            count={data.upcomingRenewals.length}
            defaultOpen={false}>
            <DataTable
              columns={renewalColumns}
              rows={data.upcomingRenewals}
              rowKey={(row) => row.id}
              emptyTitle="No renewals scheduled"
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Recent transactions"
            count={data.recentPayments.length}
            defaultOpen>
            <DataTable
              columns={paymentColumns}
              rows={data.recentPayments}
              rowKey={(row) => row.id}
              emptyTitle="No transactions yet"
            />
          </CollapsibleSection>
        </>
      ) : null}
    </div>
  );
}
