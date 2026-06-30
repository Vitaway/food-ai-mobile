import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type MiraFoodLogoProps = {
  className?: string;
  variant?: 'light' | 'dark';
  to?: string;
};

export function MiraFoodLogo({ className, variant = 'dark', to = '/' }: MiraFoodLogoProps) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/mirafood-logo.png"
        alt=""
        className="h-9 w-9 rounded-xl object-contain"
        aria-hidden
      />
      <div className="leading-tight">
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
    </Link>
  );
}
