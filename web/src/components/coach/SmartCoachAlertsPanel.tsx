import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { apiRequest } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type SmartAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  clientId: string;
  clientName: string;
  message: string;
  category: string;
};

const toneDot = {
  warning: 'bg-cinnamon-wood-500',
  critical: 'bg-red-500',
  info: 'bg-blue-spruce-500',
};

type SmartCoachAlertsPanelProps = {
  className?: string;
};

export function SmartCoachAlertsPanel({ className }: SmartCoachAlertsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['coach', 'smart-alerts'],
    queryFn: () => apiRequest<SmartAlert[]>('/coach/smart-alerts'),
    refetchInterval: 60_000,
  });

  const alerts = data ?? [];

  return (
    <DashboardPanel
      className={cn(
        'flex h-full min-h-[14rem] flex-col rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]',
        className,
      )}
      title="Smart coach alerts"
      action={
        <span className="rounded-full bg-ash-grey-100 px-2.5 py-0.5 text-[11px] font-semibold text-ash-grey-600">
          {isLoading ? '…' : `${alerts.length} open`}
        </span>
      }
      bodyClassName="flex flex-1 flex-col px-0 py-0 sm:px-0 sm:py-0">
      {isLoading ? (
        <p className="px-4 py-8 text-sm text-ash-grey-500">Loading alerts…</p>
      ) : alerts.length ? (
        <ul className="max-h-64 flex-1 divide-y divide-ash-grey-100 overflow-y-auto">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-blue-spruce-50/40">
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', toneDot[alert.severity])}
                aria-hidden
              />
              <p className="min-w-0 flex-1 truncate text-ash-grey-800">
                <span className="font-semibold text-ash-grey-900">{alert.clientName}</span>
                <span className="text-ash-grey-400"> · </span>
                <span className="text-ash-grey-600">{alert.message}</span>
              </p>
              <Link
                to={`/coach/clients/${alert.clientId}`}
                className="shrink-0 text-xs font-semibold text-blue-spruce-600 hover:underline">
                View
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <p className="text-sm font-medium text-ash-grey-800">All clear</p>
          <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ash-grey-500">
            No smart alerts right now. We’ll surface inactivity, risk, and coaching signals here.
          </p>
        </div>
      )}
    </DashboardPanel>
  );
}
