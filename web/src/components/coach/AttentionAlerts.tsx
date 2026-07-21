import { Link } from 'react-router-dom';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import type { CoachDashboardStats } from '@/types';
import { cn } from '@/lib/utils';

type AttentionAlertsProps = {
  stats: CoachDashboardStats;
  className?: string;
};

export function AttentionAlerts({ stats, className }: AttentionAlertsProps) {
  const alerts: { label: string; tone: 'warning' | 'critical' | 'info' }[] = [];
  if (stats.flagged > 0) {
    alerts.push({
      label: `${stats.flagged} flagged meal${stats.flagged > 1 ? 's' : ''}`,
      tone: 'warning',
    });
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

  const toneClass = {
    warning: 'border-cinnamon-wood-200 bg-cinnamon-wood-50 text-cinnamon-wood-900',
    critical: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-spruce-200 bg-blue-spruce-50 text-blue-spruce-900',
  };

  return (
    <DashboardPanel
      className={cn(
        'flex h-full min-h-[14rem] flex-col rounded-[1.75rem] border-ash-grey-100 shadow-[0_12px_32px_rgba(2,52,89,0.06)]',
        className,
      )}
      title="Needs attention"
      action={
        <span className="rounded-full bg-ash-grey-100 px-2.5 py-0.5 text-[11px] font-semibold text-ash-grey-600">
          {alerts.length} item{alerts.length === 1 ? '' : 's'}
        </span>
      }
      bodyClassName="flex flex-1 flex-col px-4 py-4 sm:px-5">
      {alerts.length ? (
        <>
          <ul className="flex flex-1 flex-wrap content-start gap-2">
            {alerts.map((a) => (
              <li
                key={a.label}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium',
                  toneClass[a.tone],
                )}>
                {a.label}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-4 border-t border-ash-grey-100 pt-4 text-sm">
            <Link to="/coach/queue" className="font-semibold text-blue-spruce-600 hover:underline">
              Open queue →
            </Link>
            <Link to="/coach/clients" className="font-semibold text-blue-spruce-600 hover:underline">
              View clients →
            </Link>
            <Link to="/coach/messages" className="font-semibold text-blue-spruce-600 hover:underline">
              Messages →
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-sm font-medium text-ash-grey-800">Nothing urgent</p>
          <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ash-grey-500">
            Queue wait times, flags, and unread chats will appear here when they need you.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/coach/queue" className="font-semibold text-blue-spruce-600 hover:underline">
              Open queue →
            </Link>
            <Link to="/coach/clients" className="font-semibold text-blue-spruce-600 hover:underline">
              View clients →
            </Link>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
