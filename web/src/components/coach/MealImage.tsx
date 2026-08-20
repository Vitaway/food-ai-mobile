import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUrls';

type MealImageProps = {
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Compact thumbnails for tables/lists; hides the long empty-state copy. */
  variant?: 'default' | 'thumb';
};

export function MealImage({
  imageUrl,
  thumbnailUrl,
  alt,
  className,
  imgClassName,
  variant = 'default',
}: MealImageProps) {
  const isThumb = variant === 'thumb';
  const src = resolveMediaUrl(isThumb ? thumbnailUrl || imageUrl : imageUrl || thumbnailUrl);

  if (src) {
    return (
      <div className={cn('overflow-hidden bg-ash-grey-100', className)}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      </div>
    );
  }

  if (isThumb) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden bg-ash-grey-100 text-ash-grey-400',
          className,
        )}
        aria-label="No meal photo"
        title="Meal photo not available">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-ash-grey-100 px-4 text-center text-ash-grey-500',
        className,
      )}>
      <span className="text-4xl" aria-hidden>
        🍽️
      </span>
      <p className="mt-2 text-sm font-medium text-ash-grey-700">Meal photo not available yet</p>
      <p className="mt-1 max-w-xs text-xs text-ash-grey-500">
        Ask the patient to open MiraFood once; photos sync automatically on launch.
      </p>
    </div>
  );
}
