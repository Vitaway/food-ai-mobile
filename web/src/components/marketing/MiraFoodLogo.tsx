import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type MiraFoodLogoProps = {
  className?: string;
  variant?: 'light' | 'dark';
  to?: string;
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
        <span
          className={cn(
            'text-lg font-semibold tracking-tight',
            variant === 'dark' ? 'text-mira-green' : 'text-white',
          )}>
          MiraFood
        </span>
      )}
    </Link>
  );
}
