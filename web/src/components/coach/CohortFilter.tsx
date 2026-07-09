import { useCoachCohorts } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';

export function CohortFilter() {
  const { data: cohorts } = useCoachCohorts();
  const cohortId = useCoachStore((s) => s.cohortId);
  const setCohortId = useCoachStore((s) => s.setCohortId);

  if (!cohorts?.length) return null;

  return (
    <select
      className="rounded-2xl border border-ash-grey-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-spruce-400"
      value={cohortId ?? ''}
      onChange={(e) => setCohortId(e.target.value || null)}>
      <option value="">All cohorts</option>
      {cohorts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.memberCount})
        </option>
      ))}
    </select>
  );
}
