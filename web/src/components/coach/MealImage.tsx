import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUrls';

type MealImageProps = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
};

export function MealImage({ imageUrl, alt, className, imgClassName }: MealImageProps) {
  const src = resolveMediaUrl(imageUrl);

  if (src) {
    return (
      <div className={cn('overflow-hidden bg-ash-grey-100', className)}>
        <img src={src} alt={alt} className={cn('h-full w-full object-cover', imgClassName)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-ash-grey-100 px-4 text-center text-ash-grey-500',
        className,
      )}>
      <span className="text-4xl">🍽️</span>
      <p className="mt-2 text-sm font-medium text-ash-grey-700">Meal photo not available yet</p>
      <p className="mt-1 max-w-xs text-xs text-ash-grey-500">
        Ask the patient to open MiraFood once — photos sync automatically on launch.
      </p>
    </div>
  );
}
