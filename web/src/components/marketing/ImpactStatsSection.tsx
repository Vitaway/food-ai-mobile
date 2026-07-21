import { useEffect, useRef } from 'react';
import { impactStats } from '@/constants/marketingContent';

type ImpactStatsSectionProps = {
  title?: string;
  subtitle?: string;
};

export function ImpactStatsSection({
  title = 'Outcomes that matter',
  subtitle = 'MiraFood connects accurate logging, human review, and long-term tracking.',
}: ImpactStatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    let frame = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function update() {
      frame = 0;
      if (!section || !bg || reduceMotion) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // Map section travel through the viewport to a gentle vertical shift
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 120;
      bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.15)`;
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden py-20 sm:py-28">
      <div
        ref={bgRef}
        className="absolute inset-[-12%] -z-10 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: "url('/marketing/outcomes-parallax.jpg')",
          transform: 'translate3d(0, 0, 0) scale(1.15)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-blue-spruce-900/72" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-spruce-950/40 via-transparent to-blue-spruce-950/50" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-2xl text-white/80">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {impactStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-lg backdrop-blur-md">
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{stat.value}</p>
              <p className="mt-3 text-lg text-white">{stat.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
