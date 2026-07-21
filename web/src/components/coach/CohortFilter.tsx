import { useCoachCohorts } from '@/hooks/useCoachQueries';
import { useCoachStore } from '@/stores/coachStore';
import { Select } from '@/components/ui/Select';

export function CohortFilter() {
  const { data: cohorts } = useCoachCohorts();
  const cohortId = useCoachStore((s) => s.cohortId);
  const setCohortId = useCoachStore((s) => s.setCohortId);

  if (!cohorts?.length) return null;

  return (
    <Select
      aria-label="Filter by cohort"
      variant="filter"
      size="sm"
      className="w-full sm:w-48"
      value={cohortId ?? ''}
      onChange={(value) => setCohortId(value || null)}
      options={[
        { value: '', label: 'All cohorts' },
        ...cohorts.map((c) => ({
          value: c.id,
          label: `${c.name} (${c.memberCount})`,
        })),
      ]}
    />
  );
}
