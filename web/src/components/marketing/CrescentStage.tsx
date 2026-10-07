import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';

type CrescentStageProps = {
  children?: ReactNode;
  className?: string;
  size?: 'md' | 'lg';
};

/** Olive dome pedestal for product / app imagery. */
export function CrescentStage({ children, className, size = 'lg' }: CrescentStageProps) {
  return (
    <div className={cn('mira-stage', size === 'md' && 'max-w-md sm:min-h-[20rem]', className)}>
      <div className="mira-crescent" aria-hidden />
      <div className="relative z-10 mb-1 w-full max-w-[240px] px-2 sm:max-w-[280px]">
        {children}
      </div>
    </div>
  );
}

type StagedAppShotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  size?: 'md' | 'lg';
  className?: string;
};

export function StagedAppShot({ src, alt, priority, size = 'lg', className }: StagedAppShotProps) {
  return (
    <CrescentStage size={size} className={className}>
      <AppScreenshot src={src} alt={alt} priority={priority} size={size === 'md' ? 'md' : 'lg'} />
    </CrescentStage>
  );
}

type HeroProductPairProps = {
  left: { src: string; alt: string };
  right: { src: string; alt: string };
  className?: string;
};

/** Two overlapping tilted screenshots on the olive dome — static (no float). */
export function HeroProductPair({ left, right, className }: HeroProductPairProps) {
  return (
    <div className={cn('mira-stage max-w-4xl', className)}>
      <div className="mira-crescent" aria-hidden />
      <div className="mira-hero-pair">
        <div className="mira-hero-pair__shot mira-hero-pair__shot--left">
          <img
            src={left.src}
            alt={left.alt}
            width={400}
            height={866}
            decoding="async"
            loading="eager"
            fetchPriority="high"
            className="w-full"
          />
        </div>
        <div className="mira-hero-pair__shot mira-hero-pair__shot--right">
          <img
            src={right.src}
            alt={right.alt}
            width={400}
            height={866}
            decoding="async"
            loading="eager"
            fetchPriority="high"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
