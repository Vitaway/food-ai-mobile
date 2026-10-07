import { useEffect, useState } from 'react';
import { testimonials } from '@/constants/marketingContent';

const AUTO_ADVANCE_MS = 5500;

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = testimonials[index] ?? testimonials[0];

  function prev() {
    setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));
  }

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  return (
    <section className="px-1 py-12 sm:px-2">
      <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
        Trust is built with verification
      </h2>

      <div
        className="mt-8 overflow-hidden rounded-[1.5rem] bg-mira-green text-white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        <figure className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <blockquote className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
            <p className="text-base leading-relaxed text-white/90 sm:text-lg">
              &ldquo;{active.quote}&rdquo;
            </p>
            <figcaption className="mt-8 text-sm text-white/65">
              <span className="font-semibold text-white">{active.name}</span>
              {', '}
              {active.role}
            </figcaption>
          </blockquote>
          <div className="relative min-h-[220px] sm:min-h-[260px]">
            <img
              key={active.image}
              src={active.image}
              alt={active.name}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </div>
        </figure>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={prev} aria-label="Previous" className="mira-icon-btn">
          ←
        </button>
        <button type="button" onClick={next} aria-label="Next" className="mira-icon-btn">
          →
        </button>
      </div>
    </section>
  );
}
