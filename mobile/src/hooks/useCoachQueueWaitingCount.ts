import { useEffect, useState } from 'react';

import { useCoachQueueRealtime } from '@/context/CoachQueueRealtimeContext';
import { fetchCoachStats } from '@/services/remote/coachApi';

/** Meals currently waiting in the coach review queue (for tab badges). */
export function useCoachQueueWaitingCount() {
  const { queueVersion } = useCoachQueueRealtime();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchCoachStats()
      .then((stats) => {
        if (!cancelled) setCount(Math.max(0, stats.inReview ?? 0));
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [queueVersion]);

  return count;
}
