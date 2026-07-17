import { cn } from '@/lib/utils';

export type KpiItem = {
  label: string;
  value: string | number;
  delta?: string;
  warn?: boolean;
  caption?: string;
};

type KpiStripProps = {
  items: KpiItem[];
  className?: string;
};

/** Compact KPI row — not a card grid of content. */
export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[140px] flex-1 rounded-xl border border-ash-grey-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ash-grey-500">
            {item.label}
          </p>
          <p
            className={cn(
              'mt-1 font-sans text-2xl font-semibold tracking-tight text-ash-grey-900',
              item.warn && 'text-red-600',
            )}>
            {item.value}
          </p>
          {item.delta ? (
            <p
              className={cn(
                'mt-1 text-[11px] font-semibold',
                item.warn ? 'text-red-600' : 'text-shamrock-700',
              )}>
              {item.delta}
            </p>
          ) : null}
          {item.caption ? (
            <p className="mt-1 text-[11px] leading-snug text-ash-grey-500">{item.caption}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
