import { cn } from '@/lib/utils';

type AppStoreBadgesProps = {
  className?: string;
};

/** Placeholder store URLs — replace with live App Store / Play Store links before launch. */
export const APP_STORE_URL = 'https://apps.apple.com/app/mirafood';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vitaway.foodai';

/** Matches Inzu marketing site — official badge SVGs with subtle ring hover. */
export function AppStoreBadges({ className = '' }: AppStoreBadgesProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 sm:gap-4', className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md ring-1 ring-white/20 transition-all hover:opacity-95 hover:ring-white/35">
        <img
          src="/appstore.svg"
          alt="Download on the App Store"
          className="h-11 w-auto opacity-95 sm:h-12"
          width={180}
          height={60}
        />
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md ring-1 ring-white/20 transition-all hover:opacity-95 hover:ring-white/35">
        <img
          src="/googleplay.svg"
          alt="Get it on Google Play"
          className="h-11 w-auto opacity-95 sm:h-12"
          width={203}
          height={60}
        />
      </a>
    </div>
  );
}

/** Light-background variant (support page, etc.) */
export function AppStoreBadgesLight({ className = '' }: AppStoreBadgesProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 sm:gap-4', className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md ring-1 ring-ash-grey-200 transition-all hover:opacity-95 hover:ring-ash-grey-300">
        <img
          src="/appstore.svg"
          alt="Download on the App Store"
          className="h-11 w-auto sm:h-12"
          width={180}
          height={60}
        />
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-md ring-1 ring-ash-grey-200 transition-all hover:opacity-95 hover:ring-ash-grey-300">
        <img
          src="/googleplay.svg"
          alt="Get it on Google Play"
          className="h-11 w-auto sm:h-12"
          width={203}
          height={60}
        />
      </a>
    </div>
  );
}
