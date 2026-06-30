import { cn } from '@/lib/utils';

type AppScreenshotProps = {
  src: string;
  alt: string;
  className?: string;
  /** Use on dark hero backgrounds */
  variant?: 'dark' | 'light';
  priority?: boolean;
  size?: 'md' | 'lg';
};

const sizeClasses = {
  md: 'max-w-[280px] sm:max-w-[320px]',
  lg: 'max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]',
};

export function AppScreenshot({
  src,
  alt,
  className,
  variant = 'dark',
  priority = false,
  size = 'lg',
}: AppScreenshotProps) {
  return (
    <div className={cn('relative mx-auto w-full', sizeClasses[size], className)}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-6 rounded-[3rem] blur-2xl',
          variant === 'dark' ? 'bg-white/10' : 'bg-blue-spruce-200/40',
        )}
        aria-hidden
      />
      <img
        src={src}
        alt={alt}
        width={400}
        height={866}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className="relative w-full drop-shadow-2xl"
      />
    </div>
  );
}
