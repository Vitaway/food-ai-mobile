import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { Button } from '@/components/ui/Button';
import { CONTACT_EMAIL } from '@/constants/contact';
import { coachFaqs } from '@/constants/marketingContent';
import {
  MARKETING_COACHES_BAND_IMAGE,
  MARKETING_COACHES_DESK_IMAGE,
} from '@/constants/marketingImages';
import { appImage } from '@/constants/appImages';

const coachSteps = [
  {
    title: 'Open your queue',
    desc: 'Filters for flagged and low-confidence meals — focus on what needs attention first.',
  },
  {
    title: 'Review the meal',
    desc: 'See the photo, AI draft, and client notes. Adjust ingredients and weights as needed.',
  },
  {
    title: 'Approve, edit, or reject',
    desc: 'Leave client-facing notes. Only verified nutrition enters their diary totals.',
  },
  {
    title: 'Track your performance',
    desc: 'Approval rates, queue depth, and review trends help you manage workload over time.',
  },
];

const coachOutcomes = [
  {
    value: 'Minutes',
    label: 'Per typical review',
    detail: 'Structured queue — not a full dietary recall interview every time.',
  },
  {
    value: 'Full context',
    label: 'While you review',
    detail: 'Patient file ID, goals, allergies, and today’s macros at a glance.',
  },
  {
    value: 'Your call',
    label: 'On every number',
    detail: 'AI drafts the first pass. You decide what gets approved.',
  },
];

function CoachesBand() {
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
      const shift = (progress - 0.5) * 100;
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
          backgroundImage: `url('${MARKETING_COACHES_BAND_IMAGE}')`,
          transform: 'translate3d(0, 0, 0) scale(1.15)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-blue-spruce-950/72" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">
            Built for how coaches actually work
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            MiraFood feels like a structured nutrition consult — verify AI output, edit portions, and
            keep your queue moving without losing clinical judgment.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {coachOutcomes.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md">
              <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{item.value}</p>
              <p className="mt-2 text-base text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ForCoachesPage() {
  return (
    <div className="bg-white">
      <MarketingPageHero
        title="For coaches"
        description="Review client meals like a structured nutrition consult — verify AI output, edit portions, and keep your queue moving from a clean web dashboard."
      />

      <PartnerLogosStrip />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
                Built for your workflow
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ash-grey-600 sm:text-lg">
                MiraFood fits clinical nutrition practice — it does not replace your judgment. AI
                speeds the first pass; you stay in control of every approved number.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ash-grey-700">
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Structured review queue with priority filters
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Edit portions, ingredients, and client-facing notes
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Secure web dashboard with analytics and settings
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to="/login" variant="primary" size="md">
                  Open coach dashboard
                </Button>
                <Button to="/clinical-evidence" variant="outline" size="md">
                  Our methodology
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('logMeal')} variant="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
              How it works for coaches
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
              From queue to verified diary data — a clear path for every review.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coachSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-ash-grey-200 bg-white p-6 shadow-sm">
                <span className="text-2xl font-bold text-cinnamon-wood-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-ash-grey-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CoachesBand />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative overflow-hidden rounded-[2rem] shadow-xl sm:rounded-[2.5rem]">
              <img
                src={MARKETING_COACHES_DESK_IMAGE}
                alt="Coach reviewing nutrition data on a laptop"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-spruce-950/50 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 right-5 text-sm text-white/90 sm:bottom-6 sm:left-6 sm:text-base">
                Designed for coaches — AI speed with human accountability on every meal.
              </p>
            </div>
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
                Why coaches choose MiraFood
              </h2>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg text-ash-grey-900">Priority review queue</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    Flagged and low-confidence meals surface first so you spend time where it
                    matters.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg text-ash-grey-900">Edit with full client context</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    Patient file ID, goals, allergies, and today’s macros sit beside the meal while
                    you review.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg text-ash-grey-900">Performance you can see</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    Approval rates, queue depth, and review trends help you manage workload without
                    guesswork.
                  </p>
                </div>
              </div>
              <Button to="/for-clinics" variant="outline" size="md" className="mt-8">
                See the clinic offering
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
            <ContactFormCard
              title="Join as a coach"
              defaultTopic="Coach onboarding"
              description="Tell us about your practice or clinic affiliation. We support coach onboarding and team deployment."
            />
            <div className="flex flex-col justify-between overflow-hidden rounded-[1.75rem] bg-blue-spruce-700 p-8 text-white shadow-lg sm:rounded-[2rem] sm:p-10">
              <div>
                <h2 className="text-2xl tracking-tight sm:text-3xl">Already on the team?</h2>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  Sign in to your coach dashboard to review client meals, manage your queue, and view
                  patient context.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/85">
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Review queue with priority filters
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Edit ingredients and leave client notes
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Analytics for approval rates and queue depth
                  </li>
                </ul>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button to="/login" variant="primary" size="md">
                  Open coach dashboard
                </Button>
                <Button href={`mailto:${CONTACT_EMAIL}`} variant="outline-light" size="md">
                  {CONTACT_EMAIL}
                </Button>
              </div>
              <p className="mt-6 text-sm text-white/60">
                Building for a whole clinic?{' '}
                <Link to="/for-clinics" className="text-white underline underline-offset-2">
                  Visit the clinics page
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <AudienceQASection title="Coach FAQ" items={coachFaqs} />
    </div>
  );
}
