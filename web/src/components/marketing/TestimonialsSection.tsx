import { useEffect, useState } from 'react';
import { testimonials } from '@/constants/marketingContent';
import { cn } from '@/lib/utils';

const AUTO_ADVANCE_MS = 5500;

function RwandaFlag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/20',
        className,
      )}
      aria-hidden
      title="Rwanda">
      <svg viewBox="0 0 36 36" className="h-full w-full">
        <rect width="36" height="12" y="0" fill="#00A1DE" />
        <rect width="36" height="12" y="12" fill="#E5BE01" />
        <rect width="36" height="12" y="24" fill="#20603D" />
      </svg>
    </span>
  );
}

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
    <section className="bg-ash-grey-50 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white px-5 py-12 shadow-[0_20px_60px_rgba(26,28,23,0.08)] sm:rounded-[2.5rem] sm:px-10 sm:py-16 lg:px-16">
          <h2 className="text-center text-3xl leading-tight tracking-tight text-ash-grey-900 sm:text-4xl lg:text-5xl">
            Trust is built
            <br />
            with verification
          </h2>

          <div
            className="relative mx-auto mt-12 max-w-3xl sm:mt-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setPaused(false);
              }
            }}>
            {/* Stack layers */}
            <div
              className="absolute inset-x-6 -top-5 bottom-5 rounded-[1.75rem] bg-cinnamon-wood-400 sm:inset-x-10 sm:-top-6 sm:bottom-6 sm:rounded-[2rem]"
              aria-hidden
            />
            <div
              className="absolute inset-x-3 -top-2.5 bottom-2.5 rounded-[1.75rem] bg-shamrock-600 sm:inset-x-5 sm:-top-3 sm:bottom-3 sm:rounded-[2rem]"
              aria-hidden
            />

            {/* Active card */}
            <figure className="relative grid overflow-hidden rounded-[1.75rem] bg-ash-grey-950 text-white shadow-xl sm:rounded-[2rem] lg:grid-cols-[1.15fr_0.85fr]">
              <blockquote className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
                <div>
                  <RwandaFlag />
                  <p className="mt-6 text-base leading-relaxed text-white/95 sm:text-lg">
                    &ldquo;{active.quote}&rdquo;
                  </p>
                </div>
                <figcaption className="mt-8 text-sm text-white/70">
                  <span className="font-normal text-white">{active.name}</span>
                  {', '}
                  {active.role}
                </figcaption>
              </blockquote>

              <div className="relative min-h-[240px] bg-ash-grey-950 sm:min-h-[280px] lg:min-h-full">
                <img
                  key={active.image}
                  src={active.image}
                  alt={active.name}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
                />
                <div
                  className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ash-grey-950 to-transparent lg:w-24"
                  aria-hidden
                />
              </div>
            </figure>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 sm:mt-10">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-ash-grey-100 text-ash-grey-900 transition-colors hover:bg-ash-grey-200">
              <span aria-hidden className="text-lg leading-none">
                ←
              </span>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-ash-grey-100 text-ash-grey-900 transition-colors hover:bg-ash-grey-200">
              <span aria-hidden className="text-lg leading-none">
                →
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
