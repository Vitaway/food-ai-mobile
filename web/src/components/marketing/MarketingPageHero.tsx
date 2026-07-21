import { MARKETING_HERO_IMAGE } from '@/constants/marketingImages';

type MarketingPageHeroProps = {
  title: string;
  description?: string;
  compact?: boolean;
  /** Optional override for page-specific hero imagery */
  backgroundImage?: string;
};

export function MarketingPageHero({
  title,
  description,
  compact,
  backgroundImage = MARKETING_HERO_IMAGE,
}: MarketingPageHeroProps) {
  return (
    <section
      className="relative overflow-hidden bg-blue-spruce-800 text-white"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
      <div className="absolute inset-0 bg-blue-spruce-950/60" aria-hidden />
      <div
        className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          compact ? 'py-14 sm:py-16' : 'py-16 sm:py-20 lg:py-24'
        }`}>
        <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-white/85">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
