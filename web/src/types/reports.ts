export type ExportableReport = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  metrics: Record<string, unknown>;
  variant: 'coach' | 'admin' | 'consumer';
};
