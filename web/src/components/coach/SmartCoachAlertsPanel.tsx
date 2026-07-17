import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { apiRequest } from '@/lib/apiClient';

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

export function SmartCoachAlertsPanel() {
  const { data } = useQuery({
    queryKey: ['coach', 'smart-alerts'],
    queryFn: () => apiRequest<SmartAlert[]>('/coach/smart-alerts'),
    refetchInterval: 60_000,
  });

  if (!data?.length) return null;

  return (
    <DashboardPanel
      title="Smart coach alerts"
      action={<span className="text-xs text-ash-grey-500">{data.length} open</span>}
      bodyClassName="px-0 py-0 sm:px-0 sm:py-0">
      <ul className="max-h-48 divide-y divide-ash-grey-100 overflow-y-auto">
        {data.map((alert) => (
          <li
            key={alert.id}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-ash-grey-50/80">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[alert.severity]}`}
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
    </DashboardPanel>
  );
}
