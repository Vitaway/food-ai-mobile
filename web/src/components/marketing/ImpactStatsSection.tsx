import { impactStats } from '@/constants/marketingContent';

type ImpactStatsSectionProps = {
  title?: string;
  subtitle?: string;
};

export function ImpactStatsSection({
  title = 'Outcomes that matter',
  subtitle = 'MiraFood connects accurate logging, human review, and long-term tracking.',
}: ImpactStatsSectionProps) {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {impactStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-ash-grey-200 bg-ash-grey-50 p-8 text-center shadow-sm">
              <p className={`text-4xl font-bold tracking-tight sm:text-5xl ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="mt-3 text-lg text-ash-grey-900">{stat.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
