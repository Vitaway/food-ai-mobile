import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '@/components/ui/Card';
import { fetchClientCoachingInsights } from '@/api/coachApi';

type ClientCoachingInsightsPanelProps = {
  clientId: string;
};

export function ClientCoachingInsightsPanel({ clientId }: ClientCoachingInsightsPanelProps) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['coach', 'client', clientId, 'coaching-insights'],
    queryFn: () => fetchClientCoachingInsights(clientId),
  });

  if (isLoading) {
    return <p className="text-sm text-ash-grey-500">Loading coaching insights…</p>;
  }

  if (!data.length) return null;

  return (
    <Card>
      <CardBody className="space-y-3">
        <h3 className="text-lg font-semibold text-ash-grey-900">Coaching insights</h3>
        {data.map((item) => (
          <div key={item.id} className="rounded-xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3">
            <p className="font-semibold text-ash-grey-900">{item.title}</p>
            <p className="mt-1 text-sm text-ash-grey-600">{item.body}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
