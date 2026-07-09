import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import type { CoachDashboardStats } from '@/types';

export function AttentionAlerts({ stats }: { stats: CoachDashboardStats }) {
  const alerts = [];
  if (stats.flagged > 0) {
    alerts.push({ label: `${stats.flagged} flagged meal${stats.flagged > 1 ? 's' : ''}`, tone: 'warning' });
  }
  if ((stats.waitingOverHour ?? 0) > 0) {
    alerts.push({
      label: `${stats.waitingOverHour} waiting over 1 hour`,
      tone: 'critical',
    });
  }
  if ((stats.inactiveClients ?? 0) > 0) {
    alerts.push({
      label: `${stats.inactiveClients ?? 0} client${(stats.inactiveClients ?? 0) > 1 ? 's' : ''} inactive 3+ days`,
      tone: 'info',
    });
  }
  if ((stats.unreadMessages ?? 0) > 0) {
    alerts.push({
      label: `${stats.unreadMessages ?? 0} unread message${(stats.unreadMessages ?? 0) > 1 ? 's' : ''}`,
      tone: 'info',
    });
  }

  if (!alerts.length) return null;

  const toneClass = {
    warning: 'border-cinnamon-wood-200 bg-cinnamon-wood-50 text-cinnamon-wood-900',
    critical: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-spruce-200 bg-blue-spruce-50 text-blue-spruce-900',
  };

  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-sm font-medium text-ash-grey-600">
          Needs attention
        </h3>
        <ul className="flex flex-wrap gap-2">
          {alerts.map((a) => (
            <li
              key={a.label}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${toneClass[a.tone as keyof typeof toneClass]}`}>
              {a.label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/coach/queue" className="font-semibold text-blue-spruce-600 hover:underline">
            Open queue →
          </Link>
          <Link to="/coach/clients" className="font-semibold text-blue-spruce-600 hover:underline">
            View clients →
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
