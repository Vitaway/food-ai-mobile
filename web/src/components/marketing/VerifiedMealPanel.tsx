import { APP_STORE_URL } from '@/components/marketing/AppStoreBadges';

export function VerifiedMealPanel() {
  return (
    <div className="relative flex h-full flex-col justify-center p-8 text-white sm:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Every entry reviewed before it counts
      </h2>
      <p className="mt-4 text-base leading-relaxed text-white/80">
        Meal logging, AI analysis, coach review, macros, water, and insights — connected in one app.
      </p>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mira-btn mira-btn--black mt-8 w-fit">
        Get the app
      </a>
    </div>
  );
}
