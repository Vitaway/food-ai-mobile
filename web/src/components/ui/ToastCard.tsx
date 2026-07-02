export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

export const TOAST_VISUALS: Record<
  ToastType,
  { accentClass: string; label: string; icon: 'success' | 'error' | 'info' }
> = {
  success: {
    accentClass: 'bg-shamrock-600',
    label: 'Success',
    icon: 'success',
  },
  error: {
    accentClass: 'bg-cinnamon-wood-600',
    label: 'Error',
    icon: 'error',
  },
  info: {
    accentClass: 'bg-blue-spruce-600',
    label: 'Info',
    icon: 'info',
  },
};

function ToastIcon({ kind }: { kind: 'success' | 'error' | 'info' }) {
  const className = 'h-[18px] w-[18px] shrink-0';

  if (kind === 'success') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-shamrock-600" />
        <path
          d="M8 12.5l2.5 2.5 5.5-5.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'error') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-cinnamon-wood-600" />
        <path d="M12 7.5v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="white" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-blue-spruce-600" />
      <path d="M12 10v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1" fill="white" />
    </svg>
  );
}

type ToastCardProps = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const visual = TOAST_VISUALS[toast.type];

  return (
    <div className="toast-enter relative pb-1 pr-1" role="status" aria-live="polite">
      <div className="toast-hard-shadow" aria-hidden />
      <div className="toast-card">
        <div className={`toast-accent ${visual.accentClass}`} />
        <div className="min-w-0 flex-1 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <ToastIcon kind={visual.icon} />
              <p className="truncate text-[13px] uppercase tracking-[0.08em] text-ash-grey-900">
                {toast.title ?? visual.label}
              </p>
            </div>
            <button
              type="button"
              className="mt-0.5 shrink-0 text-ash-grey-500 transition hover:text-ash-grey-700"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm leading-5 text-ash-grey-600">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
