import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { coachKeys } from '@/hooks/useCoachQueries';
import { getApiBaseUrl } from '@/lib/apiClient';

export function useCoachQueueRealtime() {
  const token = useAuthStore((s) => s.session?.token);
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const base = getApiBaseUrl().replace(/^http/, 'ws');
    const ws = new WebSocket(`${base}/ws/coach-queue?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, qc]);
}
