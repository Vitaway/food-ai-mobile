import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
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
      <Card>
        <CardBody>
          <p className="text-sm text-ash-grey-500">Loading review requests…</p>
        </CardBody>
      </Card>
    );
  }

  if (!tasks?.length) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <h3 className="font-bold text-ash-grey-900">Review requests</h3>
        <Link to="/coach/messages" className="shrink-0 text-sm font-semibold text-blue-spruce-600 hover:underline">
          Team chat
        </Link>
      </CardHeader>
      <CardBody className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ash-grey-900">{TYPE_LABELS[task.type]}</span>
              <span
                className={
                  task.status === 'open'
                    ? 'rounded-full bg-cinnamon-wood-100 px-2 py-0.5 text-xs font-semibold text-cinnamon-wood-800'
                    : 'rounded-full bg-shamrock-100 px-2 py-0.5 text-xs font-semibold text-shamrock-800'
                }>
                {task.status}
              </span>
            </div>
            {task.note ? <p className="mt-1 text-ash-grey-700">{task.note}</p> : null}
            <p className="mt-1 text-xs text-ash-grey-500">{formatRelativeTime(task.createdAt)}</p>
          </div>
        ))}
        <p className="text-xs text-ash-grey-500">
          New requests are also posted to your organization team chat (Coach lounge).
        </p>
      </CardBody>
    </Card>
  );
}
