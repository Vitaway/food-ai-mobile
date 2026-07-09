import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardPageHeaderProps = {
  title: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardPageHeader({ title, actions, className }: DashboardPageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="font-sans text-3xl font-normal tracking-tight text-ash-grey-900 normal-case">
          {title}
        </h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DashboardSectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="font-sans text-xl font-normal text-ash-grey-900 normal-case">{title}</h2>
      {action}
    </div>
  );
}
