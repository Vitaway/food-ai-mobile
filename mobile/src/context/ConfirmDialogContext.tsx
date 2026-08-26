import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { AppDialog, type AppDialogAction } from '@/components/ui/AppDialog';

export type ConfirmDialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm action as a destructive (red) button. */
  destructive?: boolean;
};

export type AlertDialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
};

type DialogState = {
  title: string;
  message?: string;
  actions: AppDialogAction[];
};

type ConfirmDialogContextValue = {
  /** Two-button confirm. Resolves `true` if confirmed, `false` if cancelled. */
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  /** Single OK dialog. */
  alert: (options: AlertDialogOptions) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setDialog({
        title: options.title,
        message: options.message,
        actions: [
          {
            label: options.cancelLabel ?? 'Cancel',
            variant: 'default',
            onPress: () => close(false),
          },
          {
            label: options.confirmLabel ?? 'Confirm',
            variant: options.destructive ? 'danger' : 'primary',
            onPress: () => close(true),
          },
        ],
      });
    });
  }, [close]);

  const alert = useCallback((options: AlertDialogOptions) => {
    return new Promise<void>((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = () => resolve();
      setDialog({
        title: options.title,
        message: options.message,
        actions: [
          {
            label: options.confirmLabel ?? 'OK',
            variant: 'primary',
            onPress: () => close(true),
          },
        ],
      });
    });
  }, [close]);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AppDialog
        visible={Boolean(dialog)}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        actions={dialog?.actions ?? []}
        onRequestClose={() => close(false)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}
