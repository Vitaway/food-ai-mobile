import { cn } from '@/lib/utils';

type AppScreenshotProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  size?: 'md' | 'lg';
};

const sizeClasses = {
  md: 'max-w-[280px] sm:max-w-[320px]',
  lg: 'max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]',
};

/** Clean product shot — no blur halo; pair with CrescentStage for the olive pedestal. */
export function AppScreenshot({
  src,
  alt,
  className,
  priority = false,
  size = 'lg',
}: AppScreenshotProps) {
  return (
    <div className={cn('relative mx-auto w-full', sizeClasses[size], className)}>
      <img
        src={src}
        alt={alt}
        width={400}
        height={866}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className="relative w-full drop-shadow-[0_18px_40px_rgba(26,58,42,0.28)]"
      />
    </div>
  );
}
