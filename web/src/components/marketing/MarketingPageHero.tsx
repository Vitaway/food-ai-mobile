type MarketingPageHeroProps = {
  title: string;
  description?: string;
  compact?: boolean;
  backgroundImage?: string;
};

export function MarketingPageHero({ title, description, compact }: MarketingPageHeroProps) {
  return (
    <section className={`px-1 sm:px-2 ${compact ? 'py-10 sm:py-12' : 'py-12 sm:py-16'}`}>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-mira-green sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-mira-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </section>
  );
}
