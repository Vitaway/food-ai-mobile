import { impactStats } from '@/constants/marketingContent';

type ImpactStatsSectionProps = {
  title?: string;
  subtitle?: string;
};

export function ImpactStatsSection({
  title = 'Outcomes that matter',
  subtitle = 'Accurate logging, human review, and long-term tracking.',
}: ImpactStatsSectionProps) {
  return (
    <section className="px-1 py-12 sm:px-2">
      <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-xl text-mira-muted">{subtitle}</p> : null}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {impactStats.map((stat) => (
          <div key={stat.label} className="rounded-[1.25rem] bg-mira-green px-6 py-8 text-white">
            <p className="text-4xl font-semibold tracking-tight sm:text-5xl">{stat.value}</p>
            <p className="mt-3 text-base font-semibold">{stat.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{stat.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
