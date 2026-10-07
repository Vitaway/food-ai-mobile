import { differentiators } from '@/constants/marketingContent';

export function DifferentiatorsSection() {
  return (
    <section className="px-1 py-12 sm:px-2">
      <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
        What makes us different
      </h2>
      <p className="mt-3 max-w-xl text-mira-muted">AI speed with human accountability.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((item) => (
          <div key={item.title} className="rounded-[1.25rem] bg-mira-green p-6 text-white">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
