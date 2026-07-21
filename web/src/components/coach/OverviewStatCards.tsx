import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type SparkPoint = number;

type OverviewStatCard = {
  label: string;
  value: string | number;
  delta: string;
  deltaPositive?: boolean;
  href?: string;
  tone: 'mint' | 'peach' | 'sky';
  spark: SparkPoint[];
};

const toneStyles = {
  mint: {
    shell: 'bg-[#e8f6ef] border-[#cfead9]',
    icon: 'bg-white/80 text-shamrock-700',
    value: 'text-ash-grey-900',
    bar: 'bg-shamrock-500',
    barMuted: 'bg-shamrock-200',
  },
  peach: {
    shell: 'bg-[#ffe8dc] border-[#ffd0b8]',
    icon: 'bg-white/80 text-cinnamon-wood-700',
    value: 'text-ash-grey-900',
    bar: 'bg-cinnamon-wood-400',
    barMuted: 'bg-cinnamon-wood-200',
  },
  sky: {
    shell: 'bg-[#e7f0f7] border-[#c9dceb]',
    icon: 'bg-white/80 text-blue-spruce-700',
    value: 'text-ash-grey-900',
    bar: 'bg-blue-spruce-500',
    barMuted: 'bg-blue-spruce-200',
  },
} as const;

function SparkBars({ values, tone }: { values: SparkPoint[]; tone: keyof typeof toneStyles }) {
  const max = Math.max(...values, 1);
  const styles = toneStyles[tone];
  return (
    <div className="mt-5 flex h-10 items-end gap-1">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className={cn('flex-1 rounded-t-md', index === values.length - 1 ? styles.bar : styles.barMuted)}
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function CardIcon({ tone }: { tone: keyof typeof toneStyles }) {
  if (tone === 'mint') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    );
  }
  if (tone === 'peach') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function OverviewStatCards({ cards }: { cards: OverviewStatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const styles = toneStyles[card.tone];
        const inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm',
                  styles.icon,
                )}>
                <CardIcon tone={card.tone} />
              </span>
              {card.href ? (
                <span className="rounded-full bg-white/70 p-1.5 text-ash-grey-500 transition group-hover:text-ash-grey-800">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-sm font-medium text-ash-grey-600">{card.label}</p>
            <p className={cn('mt-1 font-sans text-4xl font-semibold tracking-tight', styles.value)}>
              {card.value}
            </p>
            <p
              className={cn(
                'mt-2 text-sm font-semibold',
                card.deltaPositive === false ? 'text-red-600' : 'text-shamrock-700',
              )}>
              {card.delta}
            </p>
            <SparkBars values={card.spark} tone={card.tone} />
          </>
        );

        const className = cn(
          'group block rounded-[1.75rem] border p-5 shadow-[0_12px_30px_rgba(2,52,89,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(2,52,89,0.08)]',
          styles.shell,
        );

        return card.href ? (
          <Link key={card.label} to={card.href} className={className}>
            {inner}
          </Link>
        ) : (
          <div key={card.label} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
