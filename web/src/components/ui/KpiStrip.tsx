import { cn } from '@/lib/utils';

export type KpiTone = 'default' | 'info' | 'success' | 'warn' | 'accent';

export type KpiItem = {
  label: string;
  value: string | number;
  delta?: string;
  warn?: boolean;
  caption?: string;
  tone?: KpiTone;
};

type KpiStripProps = {
  items: KpiItem[];
  className?: string;
  /** Force column count on xl screens (default auto from item count, max 5). */
  columns?: 3 | 4 | 5;
};

const toneStyles: Record<
  KpiTone,
  { shell: string; bar: string; value: string; icon: string; iconBg: string }
> = {
  default: {
    shell: 'border-[#dfe5e2] bg-[#f4f6f5]',
    bar: 'bg-ash-grey-400',
    value: 'text-ash-grey-900',
    icon: 'text-ash-grey-600',
    iconBg: 'bg-white/80',
  },
  info: {
    shell: 'border-[#c9dceb] bg-[#e7f0f7]',
    bar: 'bg-blue-spruce-500',
    value: 'text-blue-spruce-800',
    icon: 'text-blue-spruce-700',
    iconBg: 'bg-white/80',
  },
  success: {
    shell: 'border-[#cfead9] bg-[#e8f6ef]',
    bar: 'bg-shamrock-500',
    value: 'text-shamrock-800',
    icon: 'text-shamrock-700',
    iconBg: 'bg-white/80',
  },
  warn: {
    shell: 'border-[#f5cfc9] bg-[#fdeceb]',
    bar: 'bg-red-500',
    value: 'text-red-700',
    icon: 'text-red-600',
    iconBg: 'bg-white/80',
  },
  accent: {
    shell: 'border-[#ffd0b8] bg-[#ffe8dc]',
    bar: 'bg-cinnamon-wood-400',
    value: 'text-cinnamon-wood-800',
    icon: 'text-cinnamon-wood-700',
    iconBg: 'bg-white/80',
  },
};

function MetricIcon({ tone }: { tone: KpiTone }) {
  const className = 'h-4 w-4';
  if (tone === 'warn') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (tone === 'info') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    );
  }
  if (tone === 'accent') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
        <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .192.168.1.1.75h4a.75.75 0 000-1.5h-3.25V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const xlCols: Record<3 | 4 | 5, string> = {
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
};

/** Shared pastel KPI tiles — use on coach + admin list/dashboard screens. */
export function KpiStrip({ items, className, columns }: KpiStripProps) {
  const xl = columns ?? (Math.min(5, Math.max(3, items.length)) as 3 | 4 | 5);

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', xlCols[xl], className)}>
      {items.map((item) => {
        const tone: KpiTone = item.warn ? 'warn' : (item.tone ?? 'default');
        const styles = toneStyles[tone];
        return (
          <div
            key={item.label}
            className={cn(
              'font-ui relative overflow-hidden rounded-[1.5rem] border p-4 shadow-[0_10px_28px_rgba(2,52,89,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(2,52,89,0.09)]',
              styles.shell,
            )}>
            <div className={cn('absolute inset-x-0 top-0 h-1', styles.bar)} aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ash-grey-600">
                {item.label}
              </p>
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                  styles.iconBg,
                  styles.icon,
                )}>
                <MetricIcon tone={tone} />
              </span>
            </div>
            <p
              className={cn(
                'mt-3 font-sans text-3xl font-semibold tracking-tight tabular-nums',
                styles.value,
              )}>
              {item.value}
            </p>
            {item.delta ? (
              <p
                className={cn(
                  'mt-1.5 text-[11px] font-semibold',
                  item.warn ? 'text-red-600' : 'text-shamrock-700',
                )}>
                {item.delta}
              </p>
            ) : null}
            {item.caption ? (
              <p className="mt-1.5 text-[11px] leading-snug text-ash-grey-600">{item.caption}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
