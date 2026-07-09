import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { apiRequest } from '@/lib/apiClient';

type SmartAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  clientId: string;
  clientName: string;
  message: string;
  category: string;
};

export function SmartCoachAlertsPanel() {
  const { data } = useQuery({
    queryKey: ['coach', 'smart-alerts'],
    queryFn: () => apiRequest<SmartAlert[]>('/coach/smart-alerts'),
    refetchInterval: 60_000,
  });

  if (!data?.length) return null;

  const toneClass = {
    warning: 'border-cinnamon-wood-200 bg-cinnamon-wood-50 text-cinnamon-wood-900',
    critical: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-spruce-200 bg-blue-spruce-50 text-blue-spruce-900',
  };

  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-sm font-medium text-ash-grey-600">
          Smart coach alerts
        </h3>
        <ul className="space-y-2">
          {data.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-xl border px-3 py-2 text-sm ${toneClass[alert.severity]}`}>
              <p className="font-semibold">{alert.clientName}</p>
              <p className="mt-0.5">{alert.message}</p>
              <Link to={`/coach/clients/${alert.clientId}`} className="mt-1 inline-block text-xs font-semibold underline">
                View client
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
