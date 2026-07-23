import { cn } from '@/lib/utils';

export type TabItem = { id: string; label: string; count?: number };

type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** underline = classic bottom border; segmented = modern pill group */
  variant?: 'underline' | 'segmented';
};

export function Tabs({ tabs, active, onChange, className, variant = 'underline' }: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div
        role="tablist"
        className={cn(
          'inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-ash-grey-200 bg-ash-grey-100/80 p-1',
          className,
        )}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white text-ash-grey-900 shadow-sm ring-1 ring-ash-grey-200/80'
                  : 'text-ash-grey-500 hover:bg-white/60 hover:text-ash-grey-800',
              )}>
              {tab.label}
              {tab.count != null ? (
                <span
                  className={cn(
                    'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActive ? 'bg-blue-spruce-50 text-blue-spruce-700' : 'bg-ash-grey-200/80 text-ash-grey-600',
                  )}>
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn('flex gap-1 overflow-x-auto border-b border-ash-grey-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative shrink-0 px-4 py-3 text-sm font-medium transition-colors',
            active === tab.id ? 'text-ash-grey-900' : 'text-ash-grey-500 hover:text-ash-grey-700',
          )}>
          {tab.label}
          {tab.count != null ? (
            <sup className="ml-1 text-xs font-bold text-ash-grey-400">{tab.count}</sup>
          ) : null}
          {active === tab.id ? (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-spruce-600" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
