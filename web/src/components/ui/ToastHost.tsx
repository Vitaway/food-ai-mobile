import type { ToastItem } from '@/components/ui/ToastCard';
import { ToastCard } from '@/components/ui/ToastCard';

type ToastHostProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-host" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
