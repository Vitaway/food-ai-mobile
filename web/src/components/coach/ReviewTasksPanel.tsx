import { Link } from 'react-router-dom';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { useReviewTasks } from '@/hooks/useCoachQueries';
import { formatRelativeTime } from '@/lib/utils';

const TYPE_LABELS = {
  second_opinion: 'Second opinion',
  escalation: 'Escalation',
} as const;

export function ReviewTasksPanel({ mealId }: { mealId: string }) {
  const { data: tasks, isLoading } = useReviewTasks(mealId);

  if (isLoading) {
    return (
      <DashboardPanel title="Review requests">
        <p className="px-3 py-4 text-sm text-ash-grey-500">Loading review requests…</p>
      </DashboardPanel>
    );
  }

  if (!tasks?.length) return null;

  return (
    <DashboardPanel
      title="Review requests"
      action={
        <Link to="/coach/messages" className="text-sm font-semibold text-blue-spruce-600 hover:underline">
          Team chat
        </Link>
      }>
      <div className="space-y-2 px-3 py-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ash-grey-900">{TYPE_LABELS[task.type]}</span>
              <StatusPill tone={task.status === 'open' ? 'warn' : 'good'}>{task.status}</StatusPill>
            </div>
            {task.note ? <p className="mt-1 text-ash-grey-700">{task.note}</p> : null}
            <p className="mt-1 text-xs text-ash-grey-500">
              {formatRelativeTime(task.createdAt)}
              {task.assigneeCoachId || task.assigneeUserId ? ' · Assigned to a teammate' : ' · Team chat'}
            </p>
          </div>
        ))}
        <p className="text-xs text-ash-grey-500">
          New requests are also posted to your organization team chat (Coach lounge).
        </p>
      </div>
    </DashboardPanel>
  );
}
