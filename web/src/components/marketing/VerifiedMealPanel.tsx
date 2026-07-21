import { useEffect, useRef } from 'react';
import { APP_STORE_URL } from '@/components/marketing/AppStoreBadges';
import { Button } from '@/components/ui/Button';
import { MARKETING_VERIFIED_MEAL_IMAGE } from '@/constants/marketingImages';

export function VerifiedMealPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const bg = bgRef.current;
    if (!panel || !bg) return;

    let frame = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function update() {
      frame = 0;
      if (!panel || !bg || reduceMotion) return;
      const rect = panel.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 80;
      bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.2)`;
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
    <div ref={panelRef} className="relative isolate overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-[-18%] -z-10 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url('${MARKETING_VERIFIED_MEAL_IMAGE}')`,
          transform: 'translate3d(0, 0, 0) scale(1.2)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-blue-spruce-950/62" aria-hidden />
      <div className="relative flex h-full flex-col justify-center p-8 sm:p-12 lg:p-14">
        <h2 className="text-2xl leading-tight tracking-tight text-white sm:text-3xl">
          Verified meal data
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
          Meal logging, AI analysis, coach review, macro tracking, water goals, streaks, and
          personalized insights — MiraFood connects every step of your nutrition journey in one
          app.
        </p>
        <Button href={APP_STORE_URL} target="_blank" variant="primary" size="md" className="mt-8">
          Get the app
        </Button>
      </div>
    </div>
  );
}
