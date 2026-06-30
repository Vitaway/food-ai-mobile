type MarketingPageHeroProps = {
  title: string;
  description?: string;
  compact?: boolean;
};

export function MarketingPageHero({ title, description, compact }: MarketingPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-blue-spruce-600 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"
        aria-hidden
      />
      <div
        className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          compact ? 'py-14 sm:py-16' : 'py-16 sm:py-20 lg:py-24'
        }`}>
        <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
