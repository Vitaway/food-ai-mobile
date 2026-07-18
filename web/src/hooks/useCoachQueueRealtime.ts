import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useToast } from '@/context/ToastContext';
import { coachKeys } from '@/hooks/useCoachQueries';
import { getApiBaseUrl } from '@/lib/apiClient';

type QueuePayload = {
  type?: string;
  reason?: string;
  mealId?: string;
  mealName?: string;
  mealType?: string;
  clientName?: string;
};

const toastedSubmittedMealIds = new Set<string>();

function claimMealToast(mealId: string) {
  if (!mealId || toastedSubmittedMealIds.has(mealId)) return false;
  toastedSubmittedMealIds.add(mealId);
  if (toastedSubmittedMealIds.size > 200) {
    const first = toastedSubmittedMealIds.values().next().value;
    if (first) toastedSubmittedMealIds.delete(first);
  }
  return true;
}

export function useCoachQueueRealtime() {
  const token = useAuthStore((s) => s.session?.token);
  const qc = useQueryClient();
  const toast = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!token) return;

    const base = getApiBaseUrl().replace(/^http/, 'ws');
    const ws = new WebSocket(`${base}/ws/coach-queue?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });

      try {
        const payload = JSON.parse(String(event.data)) as QueuePayload;
        if (payload.type !== 'queue_updated') return;
        if (payload.reason !== 'submitted') return;
        if (payload.mealId && !claimMealToast(payload.mealId)) return;

        const client = payload.clientName?.trim() || 'A patient';
        const meal = payload.mealName?.trim() || payload.mealType?.trim() || 'a meal';
        toastRef.current.incoming(
          `${client} submitted ${meal} for review.`,
          'New meal in queue',
          'info',
        );
      } catch {
        /* invalidate already ran */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, qc]);
}
