import { cn } from '@/lib/utils';

export type StatusPillTone = 'good' | 'warn' | 'bad' | 'muted' | 'info';

const toneClasses: Record<StatusPillTone, string> = {
  good: 'bg-shamrock-50 text-shamrock-800',
  warn: 'bg-cinnamon-wood-50 text-cinnamon-wood-800',
  bad: 'bg-red-50 text-red-700',
  muted: 'bg-ash-grey-100 text-ash-grey-600',
  info: 'bg-blue-spruce-50 text-blue-spruce-800',
};

type StatusPillProps = {
  children: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
};

export function StatusPill({ children, tone = 'muted', className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}>
      {children}
    </span>
  );
}

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FilterChip({ label, active, onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-blue-spruce-700 bg-blue-spruce-600 text-white'
          : 'border-ash-grey-200 bg-white text-ash-grey-700 hover:bg-ash-grey-50',
        className,
      )}>
      {label}
    </button>
  );
}
