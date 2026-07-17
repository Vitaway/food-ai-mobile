import { useCallback, useState } from 'react';
import { ConfirmModal, type ConfirmTone } from '@/components/ui/ConfirmModal';

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (ok: boolean) => void;
};

/**
 * Promise-based confirmation for risky updates.
 *
 * ```ts
 * const { confirm, dialog } = useConfirmDialog();
 * const ok = await confirm({ title: 'Approve meal?', description: '…', tone: 'primary' });
 * if (!ok) return;
 * await mutate();
 * // render {dialog} once in the page
 * ```
 */
export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (ok: boolean) => {
      if (!pending) return;
      pending.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  const dialog = (
    <ConfirmModal
      open={Boolean(pending)}
      title={pending?.title ?? ''}
      description={pending?.description ?? ''}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, dialog };
}
