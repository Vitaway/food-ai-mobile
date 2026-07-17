import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardPanelProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** White panel with title — preferred wrapper for dashboard tables. */
export function DashboardPanel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-ash-grey-200 bg-white shadow-sm',
        className,
      )}>
      <div className="flex items-center justify-between gap-3 border-b border-ash-grey-100 px-4 py-3 sm:px-5">
        <h2 className="font-sans text-sm font-semibold tracking-tight text-ash-grey-900 normal-case">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('px-1 py-1 sm:px-2 sm:py-2', bodyClassName)}>{children}</div>
    </section>
  );
}
