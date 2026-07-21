import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type MiraFoodLogoProps = {
  className?: string;
  variant?: 'light' | 'dark';
  to?: string;
  /** Icon-only mark for collapsed sidebar rails. */
  compact?: boolean;
};

export function MiraFoodLogo({
  className,
  variant = 'dark',
  to = '/',
  compact = false,
}: MiraFoodLogoProps) {
  return (
    <Link
      to={to}
      className={cn('flex items-center gap-2.5', compact && 'justify-center', className)}
      aria-label="MiraFood by Vitaway">
      <img
        src="/mirafood-logo.png"
        alt=""
        className="h-9 w-9 shrink-0 rounded-xl object-contain"
        aria-hidden
      />
      {compact ? null : (
        <div className="min-w-0 leading-tight">
          <span
            className={cn(
              'block text-lg font-normal tracking-tight',
              variant === 'dark' ? 'text-blue-spruce-700' : 'text-white',
            )}>
            MiraFood
          </span>
          <span
            className={cn(
              'block text-[10px] font-normal uppercase tracking-widest',
              variant === 'dark' ? 'text-ash-grey-500' : 'text-white/60',
            )}>
            by Vitaway
          </span>
        </div>
      )}
    </Link>
  );
}
