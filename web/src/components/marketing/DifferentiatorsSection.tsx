import { useEffect, useRef } from 'react';
import { differentiators } from '@/constants/marketingContent';
import { cn } from '@/lib/utils';

export function DifferentiatorsSection() {
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
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 140;
      bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.18)`;
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
        className="absolute inset-[-14%] -z-10 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: "url('/marketing/process-parallax.jpg')",
          transform: 'translate3d(0, 0, 0) scale(1.18)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-ash-grey-950/70" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-blue-spruce-950/35" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">
            What makes us different
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            Clinical-grade nutrition support — AI speed with human accountability.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-3xl border border-white/15 bg-white/10 p-6 shadow-lg backdrop-blur-md">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl text-lg text-white',
                  item.color,
                )}>
                {item.icon}
              </span>
              <h3 className="mt-4 text-lg text-white">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/75">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
