import { cn } from '@/lib/utils';

type Tab = { id: string; label: string; count?: number };

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-ash-grey-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative shrink-0 px-4 py-3 text-sm font-normal transition-colors',
            active === tab.id
              ? 'text-ash-grey-900'
              : 'text-ash-grey-500 hover:text-ash-grey-700',
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
