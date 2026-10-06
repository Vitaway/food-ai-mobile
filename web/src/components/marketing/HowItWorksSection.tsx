import { homeSteps } from '@/constants/marketingContent';

export function HowItWorksSection() {
  return (
    <section className="px-1 py-12 sm:px-2">
      <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
        How it works
      </h2>
      <p className="mt-3 max-w-xl text-mira-muted">
        From snap to coach-verified nutrition in four steps.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {homeSteps.map((item, index) => (
          <div key={item.step} className="rounded-[1.25rem] bg-mira-green p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
